import styles from './Transactions.module.scss'
import { BsCoin, BsCalendarWeek, BsGlobe2 } from 'react-icons/bs'
import { MdShuffle, MdOutlineSavings } from 'react-icons/md'
import { useRelayerData } from 'hooks'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { Loading, Button } from 'components/common'
import networks from 'consts/networks'
import { getTransactionSummary } from 'lib/humanReadableTransactions'
import { Bundle } from 'adex-protocol-eth'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import fetch from 'node-fetch'
import { useToasts } from 'hooks/toasts'
import { toBundleTxn } from 'ambire-common/src/services/requestToBundleTxn'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min'
import { formatFloatTokenAmount } from 'lib/formatters'
import { formatUnits } from 'ethers/lib/utils'
import { ToolTip } from 'components/common'
import { ReactComponent as SignedMsgActiveIcon } from './images/signed-messages-active.svg'
import { ReactComponent as SignedMsgInactiveIcon } from './images/signed-messages-inactive.svg'
import { ReactComponent as WaitingTxsIcon } from './images/waiting.svg'
import { ReactComponent as PendingTxsIcon } from './images/pending.svg'
import { ReactComponent as ConfirmedActiveTxsIcon } from './images/confirmed-active.svg'
import { ReactComponent as ConfirmedInactiveTxsIcon } from './images/confirmed-inactive.svg'

// eslint-disable-next-line import/no-relative-parent-imports
import { getAddedGas } from '../../SendTransaction/helpers'
import useConstants from 'hooks/useConstants'

import { Image, Pagination } from 'components/common'
import { id } from 'ethers/lib/utils'

import { AiFillAppstore } from 'react-icons/ai'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import cn from 'classnames'
import { isHexString, toUtf8String } from 'ethers/lib/utils'
import { useLocalStorage } from 'hooks'

// 10% in geth and most EVM chain RPCs; relayer wants 12%
const RBF_THRESHOLD = 1.14
const TO_GAS_TANK = `to Gas Tank`
const ITEMS_PER_PAGE = 8

function getMessageAsText(msg) {
  if (isHexString(msg)) {
    try {
      return toUtf8String(msg)
    } catch (_) {
      return msg
    }
  }
  return msg?.toString ? msg.toString() : msg + "" //what if dapp sends it as object? force string to avoid app crashing
}


function Transactions ({ relayerURL, selectedAcc, selectedNetwork, showSendTxns, addRequest, eligibleRequests, setSendTxnState, privateMode, showMessagesView }) {
  const { addToast } = useToasts()
  const history = useHistory()
  const params = useParams()
  const parentPage = params.page
  const [showMessages, setShowMessages] = useState(!!showMessagesView)
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())

  // @TODO refresh this after we submit a bundle; perhaps with the upcoming transactions service
  // We want this pretty much on every rerender with a 5 sec debounce
  useEffect(() => {
    if ((Date.now() - cacheBreak) > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 10000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData({ url })
  const urlGetFeeAssets = relayerURL ? `${relayerURL}/gas-tank/assets?cacheBreak=${cacheBreak}` : null
  const { data: feeAssets } = useRelayerData({ url: urlGetFeeAssets })

  const showSendTxnsForReplacement = useCallback(bundle => {
    bundle.txns
      .forEach((txn, index) => {
        addRequest({
          id: 'replace_'+index,
          chainId: selectedNetwork.chainId,
          account: selectedAcc,
          type: 'eth_sendTransaction',
          txn: {
            to: txn[0].toLowerCase(),
            value: txn[1] === "0x" ? "0x0" : txn[1],
            data: txn[2]
          }
        })
      })

    setSendTxnState({ showing: true, replaceByDefault: true, mustReplaceNonce: bundle.nonce })
  }, [addRequest, selectedNetwork, selectedAcc, setSendTxnState])

  const maxBundlePerPage = 10
  const executedTransactions = data ? data.txns.filter(x => x.executed) : []


  const [expansions, setExpansions] = useState({})
  const [messages] = useLocalStorage({
    storage: useLocalStorage,
    key: 'signedMessages',
    defaultValue: []
  })

  const filteredMessages = useMemo(() =>
    messages
      .filter(m =>
        m.accountId === selectedAcc
        && m.networkId === selectedNetwork.chainId
      )
      .sort((a, b) => b.date - a.date)
  , [messages, selectedNetwork, selectedAcc])

  // Even though maxPages is only used for txsPagination, msgsPagination can overflow with a wrong param without this
  const maxPages = showMessages ? Math.ceil(filteredMessages.length / ITEMS_PER_PAGE) : Math.ceil(executedTransactions.length / maxBundlePerPage)
  const defaultPage = useMemo(() => Math.min(Math.max(Number(params.page), 1), maxPages) || 1, [params.page, maxPages])
  const [page, setPage] = useState(defaultPage)
  const [paginatedMessages, setPaginatedMessages] = useState([])

  const bundlesList = executedTransactions
    .slice((page - 1) * maxBundlePerPage, page * maxBundlePerPage)
    .map(bundle => <BundlePreview bundle={bundle} mined={true} feeAssets={feeAssets} />)

  useEffect(() => !isLoading && (showMessages ? history.replace(`/wallet/transactions/messages/${page}`) : history.replace(`/wallet/transactions/${page}`)), [page, history, isLoading, showMessages])
  useEffect(() => setPage(defaultPage), [selectedAcc, selectedNetwork, defaultPage])

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section className={cn(styles.transactions)}>
    <h3 className={cn(styles.validationError)}>Unsupported: not currently connected to a relayer.</h3>
  </section>)

  // Removed fee txn if Gas tank is not used for payment method
  const removeFeeTxnFromBundleIfGasTankDisabled = bundle => !bundle.gasTankFee ?  { ...bundle, txns: bundle.txns.slice(0, -1) } : bundle

  // @TODO: visualize other pending bundles
  const allPending = data && data.txns.filter(x => !x.executed && !x.replaced)
  const firstPending = allPending && allPending[0]

  const mapToBundle = (relayerBundle, extra = {}) => (new Bundle({
    ...relayerBundle,
    nonce: relayerBundle.nonce.num,
    gasLimit: null,
    // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
    minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
    ...extra
  }))
  const cancelByReplacing = relayerBundle => setSendTxnState({
    showing: true,
    replacementBundle: mapToBundle(relayerBundle, {
      txns: [[selectedAcc, '0x0', '0x']],
    }),
    mustReplaceNonce: relayerBundle.nonce.num
  })
  const cancel = relayerBundle => {
    // @TODO relayerless
    mapToBundle(relayerBundle).cancel({ relayerURL, fetch })
      .then(({ success, message }) => {
        if (!success) {
          if (message.includes('not possible to cancel')) {
            addToast('Transaction already picked up by the network, you will need to pay a fee to replace it with a cancellation transaction.')
          } else {
            addToast(`Not possible to cancel: ${message}, you will need to pay a fee to replace it with a cancellation transaction.`)
          }
          cancelByReplacing(relayerBundle)
        } else {
          addToast('Transaction cancelled successfully')
        }
      })
      .catch(e => {
        console.error(e)
        cancelByReplacing(relayerBundle)
      })
  }

  // @TODO: we are currently assuming the last txn is a fee; change that (detect it)
  const speedup = relayerBundle => setSendTxnState({
    showing: true,
    replacementBundle: mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)),
    mustReplaceNonce: relayerBundle.nonce.num
  })
  const replace = relayerBundle => showSendTxnsForReplacement(mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)))

  const paginationControls = (
    <div className={cn(styles.paginationControls)}>
      <div className={cn(styles.paginationTitle)}>Page</div>
      <Button clear mini onClick={() => page > 1 && setPage(page => page - 1)}><HiOutlineChevronLeft/></Button>
      <div className={cn(styles.paginationCurrent)}>{ page } <span>/ { maxPages }</span></div>
      <Button clear mini onClick={() => page < maxPages && setPage(page => page + 1)}><HiOutlineChevronRight/></Button>
    </div>
  )

  const msgPaginationControls = (
    <div className={cn(styles.paginationControls)}>
      <Pagination
        items={filteredMessages}
        setPaginatedItems={setPaginatedMessages}
        itemsPerPage={ITEMS_PER_PAGE}
        url='/wallet/transactions/messages/{p}'
        parentPage={parentPage}
      />
    </div>
  )

  return (
    <section className={cn(styles.transactions)}>
      {!!eligibleRequests.length && (<div className={cn(styles.panel, styles.waitingTransactions)}>
        <div className={cn(styles.panelHeading)}>
          <div className={cn(styles.title)}><WaitingTxsIcon/>Waiting to be signed (current batch)</div>
        </div>
        <div className={cn(styles.content)}>
          <div className={cn(styles.bundle)}>
            <div className={cn(styles.bundleList)} onClick={() => showSendTxns(null)}>
              {eligibleRequests.map(req => (
                <TxnPreview
                  key={req.id}
                  network={selectedNetwork.id}
                  account={selectedAcc}
                  disableExpand={true}
                  txn={toBundleTxn(req.txn, selectedAcc)}
                />
              ))}
            </div>
              <div className={cn(styles.actions)}>
                {/*
                <Button small className='cancel' onClick={
                  () => resolveMany(eligibleRequests.map(x => x.id), { message: 'Ambire user rejected all requests' })
                }>Reject all</Button>*/}
                <Button small primaryGradient className={cn(styles.gradient)} onClick={() => showSendTxns(null)}>Sign or Reject</Button>
              </div>
          </div>
        </div>
      </div>)}
      { !!firstPending && (<div className={cn(styles.panel, styles.pending)}>
        <div className={cn(styles.panelHeading)}>
          <div className={cn(styles.title)}><PendingTxsIcon/>Pending transactions</div>
        </div>
        <div className={cn(styles.content)}>
          <div className={cn(styles.bundle)}>
            <BundlePreview bundle={firstPending} feeAssets={feeAssets} />
            <div className={cn(styles.actions)}>
              <Button small className={cn(styles.cancel)} onClick={() => cancel(firstPending)}>Cancel</Button>
              <Button small className={cn(styles.speedUp)} onClick={() => speedup(firstPending)}>Speed up</Button>
              <Button small primaryGradient className={cn(styles.gradient)} onClick={() => replace(firstPending)}>Replace or Modify</Button>
            </div>
          </div>
        </div>
      </div>) }
      {allPending && allPending.length > 1 && (<h4>NOTE: There are a total of {allPending.length} pending transaction bundles.</h4>)}

      <div className={cn(styles.panel, styles.confirmed)}>
        <div className={cn(styles.panelHeading)}>
          <div className={cn(styles.title)}>
            {showMessages ? <ConfirmedInactiveTxsIcon /> : <ConfirmedActiveTxsIcon/> }
            <button className={showMessages ? cn(styles.inactive) : cn(styles.active)} onClick={() => setShowMessages(false)}>Confirmed Transactions</button>
          </div>
          <div className={cn(styles.title)}>
          {showMessages ? <SignedMsgActiveIcon /> : <SignedMsgInactiveIcon/> }
            <button className={showMessages ? cn(styles.active) : cn(styles.inactive)} onClick={() => setShowMessages(true)}>Signed Messages</button>
          </div>
          {/* { !bundlesList.length ? null : paginationControls } */}
          {
            showMessages ?
            msgPaginationControls :
            paginationControls
          }
        </div>
        {
          !showMessages && (<div className={cn(styles.content)}>
          {!relayerURL && (<h3 className={cn(styles.validationError)}>Unsupported: not currently connected to a relayer.</h3>)}
          {errMsg && (<h3 className={cn(styles.validationError)}>Error getting list of transactions: {errMsg}</h3>)}
          {
            isLoading && !data ? <Loading /> :
              !bundlesList.length ? null :
              <>
                  { bundlesList }
                  {
                    paginationControls
                  }
                </>
          }
        </div>)}
        { showMessages &&
        (!filteredMessages.length
          ? (
            <div className={cn(styles.signedMessages)}>
              No messages signed with the account { privateMode.hidePrivateValue(selectedAcc) } yet on {selectedNetwork.id}
            </div>
          )
          : (
            <div>
              <div className={cn(styles.signedMessages)}>
                <div className={cn(styles.headerContainer)}>
                  <div className={cn(styles.dapp, styles.colDapp)}>
                    <div className={cn(styles.dappTitle)}>Dapp</div>
                  </div>
                  <div className={cn(styles.colSigtype)}>Type</div>
                  <div className={cn(styles.colDate)}>Signed on</div>
                  <div className={cn(styles.colExpand, styles.signatureExpand)}></div>
                </div>
                {
                  paginatedMessages && paginatedMessages.map((m, index) => {
                    const hash = id(JSON.stringify(m))
                    return (
                      <div className={cn(styles.subContainer)} key={index} >
                        <div className={cn(styles.subContainerVisible)} >
                          <div className={cn(styles.dapp, styles.colDapp)} >
                            <div className={cn(styles.dappIcon)} >
                              {
                                m.dApp?.icons[0]
                                  ? (
                                    <Image src={m.dApp.icons[0]} size={32} />
                                  )
                                  : (
                                    <AiFillAppstore style={{ opacity: 0.5 }}/>
                                  )
                              }
                            </div>
                            <div className={cn(styles.dappTitle)} >{m.dApp?.name || 'Unknown dapp'}</div>
                          </div>
                          <div className={cn(styles.colSigtype)} >{m.typed ? '1271 TypedData' : 'Standard'}</div>
                          <div
                            className={cn(styles.colDate)} >{`${new Date(m.date).toLocaleDateString()} ${new Date(m.date).toLocaleTimeString()}`}</div>
                          <div className={cn(styles.colExpand, styles.signatureExpand)} onClick={() => {
                            setExpansions(prev => ({ ...prev, [hash]: !prev[hash] }))
                          }}>{expansions[hash] ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        </div>
                        {
                          expansions[hash] &&
                          <div className={cn(styles.subContainerExpanded)}>
                            <div>
                              <b>Signer</b>
                              <div className={cn(styles.messageContent)} >
                                {m.signer.address || m.signer.quickAcc}
                              </div>
                            </div>
                            <div>
                              <b>Message</b>
                              <div className={cn(styles.messageContent)} >
                                {
                                  m.typed
                                    ? <div>{JSON.stringify(m.message, null, ' ')}</div>
                                    : <div>{getMessageAsText(m.message)}</div>
                                }
                              </div>
                            </div>
                            <div>
                              <b>Signature</b>
                              <div className={cn(styles.messageContent)} >
                                {m.signature}
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    )
                  })
                }
              </div>
              <div className={cn(styles.bottomMsgPagination)}>
                { msgPaginationControls }
              </div>
            </div>
          )
        )
      }

      </div>
    </section>
  )
}

const BundlePreview = React.memo(({ bundle, mined = false, feeAssets }) => {
  const { constants: { tokenList, humanizerInfo } } = useConstants()
  const network = networks.find(x => x.id === bundle.network)
  if (!Array.isArray(bundle.txns)) return (<h3 className={cn(styles.error)}>Bundle has no transactions (should never happen)</h3>)
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(humanizerInfo, tokenList, lastTxn, bundle.network, bundle.identity)
  const hasFeeMatch = (bundle.txns.length > 1) && lastTxnSummary.match(new RegExp(TO_GAS_TANK, 'i'))
  const txns = (hasFeeMatch && !bundle.gasTankFee) ? bundle.txns.slice(0, -1) : bundle.txns
  const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  const feeTokenDetails = feeAssets ? feeAssets.find(i => i.symbol === bundle.feeToken) : null
  const savedGas = feeTokenDetails ? getAddedGas(feeTokenDetails) : null
  const splittedLastTxnSummary = lastTxnSummary.split(' ')
  const fee = splittedLastTxnSummary.length ? splittedLastTxnSummary[1] + ' ' + splittedLastTxnSummary[2] : []
  const cashback = (bundle.gasTankFee && bundle.gasTankFee.cashback && feeTokenDetails) ? 
    (formatUnits(bundle.gasTankFee.cashback.toString(), feeTokenDetails?.decimals).toString() * feeTokenDetails?.price) : 0
  const totalSaved =  savedGas && 
    ((bundle.feeInUSDPerGas * savedGas) + cashback)

  return (<div className={cn(styles.bundlePreview, styles.bundle)} key={bundle._id}>
    {txns.map((txn, i) => (<TxnPreview
      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
      txn={txn} network={bundle.network} account={bundle.identity} mined={mined} 
      addressLabel={!!bundle.meta && bundle.meta.addressLabel}
      feeAssets={feeAssets}
      />
    ))}
    <ul className={cn(styles.details)}>
      {
        (hasFeeMatch && !bundle.gasTankFee) ?
          <li>
            <label><BsCoin/>Fee</label>
            <p>{ fee.split(' ').map((x, i) => i === 0 ? formatFloatTokenAmount(x, true, 8) : x).join(' ') }</p>
          </li>
          :
          null
      }
      {
        bundle.executed && !bundle.executed.success && (
          <li>
            <label>Error</label>
            <p>{bundle.executed.errorMsg || 'unknown error'}</p>
          </li>
        )
      }
      {
        bundle.gasTankFee && (feeTokenDetails !== null) && mined && (
        <>
          { savedGas &&(
            <ToolTip label={`
              You saved $ ${formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}, ${ (cashback > 0) ? `and got back $ ${formatFloatTokenAmount(cashback, true, 6)} as cashback,` : ''} ended up paying only $ ${formatFloatTokenAmount(((bundle.feeInUSDPerGas * bundle.gasLimit) - cashback), true, 6)}
            `}>
              <li>
                <label><BsCoin/>Fee (Paid with Gas Tank)</label>
                <p>$ {formatFloatTokenAmount(((bundle.feeInUSDPerGas * bundle.gasLimit) - cashback), true, 6)}</p>
              </li>
            </ToolTip>
          )}
          { savedGas && ( 
            <ToolTip label={`
              Saved: $ ${formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6)}
              ${ (cashback > 0) ? `Cashback: $ ${formatFloatTokenAmount(cashback, true, 6)}` : ''}
            `}>
              <li>
                <label><MdOutlineSavings/>Total Saved</label>
                $ {formatFloatTokenAmount(totalSaved, true, 6)}
              </li>
            </ToolTip>
          )}
        </>) 
      }
      <li>
        <label><BsCalendarWeek/>Submitted on</label>
        <p>{bundle.submittedAt && (toLocaleDateTime(new Date(bundle.submittedAt))).toString()}</p>
      </li>
      { bundle.gasTankFee && !mined && (
            <li>
              <label><MdOutlineSavings/>Saved by Gas Tank</label>
              $ { formatFloatTokenAmount(bundle.feeInUSDPerGas * savedGas, true, 6) }
              <span style={{color: '#ebaf40'}}>+ cashback is pending</span>
            </li>
          )}
      {
        bundle.replacesTxId ?
          <li>
            <label><MdShuffle/>Replaces transaction</label>
            <p>{bundle.replacesTxId}</p>
          </li>
          :
          null
      }
      {
        bundle.txId ?
          <li>
            <label><BsGlobe2/>Block Explorer</label>
            <p><a className={cn(styles.explorerUrl)} href={network.explorerUrl+'/tx/'+bundle.txId} target='_blank' rel='noreferrer'>{network.explorerUrl.split('/')[2]}</a></p>
          </li>
          :
          null
      }
    </ul>
  </div>)
})

export default Transactions
