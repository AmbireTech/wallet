import './Transactions.scss'
import { FaSignature, FaMinus, FaPlus } from 'react-icons/fa'
import { BsCoin, BsCalendarWeek, BsGlobe2, BsCheck2All } from 'react-icons/bs'
import { MdOutlinePendingActions, MdShuffle, MdCheck, MdOutlineSavings } from 'react-icons/md'
import { useRelayerData } from 'hooks'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { Loading, Button } from 'components/common'
import networks from 'consts/networks'
import { getTransactionSummary } from 'lib/humanReadableTransactions'
import { Bundle } from 'adex-protocol-eth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import fetch from 'node-fetch'
import { useToasts } from 'hooks/toasts'
import { toBundleTxn } from 'lib/requestToBundleTxn'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min'
import { formatFloatTokenAmount } from 'lib/formatters'
import { formatUnits } from 'ethers/lib/utils'
import { ToolTip } from 'components/common'
// eslint-disable-next-line import/no-relative-parent-imports
import { getAddedGas } from '../../SendTransaction/helpers'

// 10% in geth and most EVM chain RPCs; relayer wants 12%
const RBF_THRESHOLD = 1.14
const TO_GAS_TANK = `to Gas Tank`


function Transactions ({ relayerURL, selectedAcc, selectedNetwork, showSendTxns, addRequest, eligibleRequests, setSendTxnState }) {
  const { addToast } = useToasts()
  const history = useHistory()
  const params = useParams()

  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  const [bundleExpanded, setBundleExanded] = useState({})

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
  const { data, errMsg, isLoading } = useRelayerData(url)
  const urlGetFeeAssets = relayerURL ? `${relayerURL}/gas-tank/assets?cacheBreak=${cacheBreak}` : null
  const { data: feeAssets }= useRelayerData(urlGetFeeAssets)

  const showSendTxnsForReplacement = useCallback(bundle => {

    let ids = []

    bundle.txns.slice(0, -1)
      .forEach((txn, index) => {
        ids.push('replace_' + index) // not to interefere with pending ids with existing indexes
        addRequest({
          id: ids[ids.length - 1],
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

    // need to explicitly compare the bundle.nonce we want to modify
    let replacementBundle = new Bundle({...bundle})
    replacementBundle.txns = bundle.txns.slice(0, -1)
    replacementBundle.replacedRequestIds = ids // adding props for resolveMany, in case of rejection/validation in SendTransaction

    setSendTxnState({ showing: true, replacementBundle })
  }, [addRequest, selectedNetwork, selectedAcc, setSendTxnState])

  const maxBundlePerPage = 10
  const executedTransactions = data ? data.txns.filter(x => x.executed) : []
  const maxPages = Math.ceil(executedTransactions.length / maxBundlePerPage)

  const defaultPage = useMemo(() => Math.min(Math.max(Number(params.page), 1), maxPages) || 1, [params.page, maxPages])
  const [page, setPage] = useState(defaultPage)

  const bundlesList = executedTransactions
    .slice((page - 1) * maxBundlePerPage, page * maxBundlePerPage)
    .map(bundle => BundlePreview({
      bundle: {
        ...bundle,
        expanded: bundleExpanded[bundle._id],
        expand: (expanded) => setBundleExanded((prev) => {
          prev[bundle._id] = expanded
          return {...prev}
        })
      },
      mined: true,
      feeAssets
    }))

  useEffect(() => !isLoading && history.replace(`/wallet/transactions/${page}`), [page, history, isLoading])
  useEffect(() => setPage(defaultPage), [selectedAcc, selectedNetwork, defaultPage])

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  if (!relayerURL) return (<section id='transactions'>
    <h3 className='validation-error'>Unsupported: not currently connected to a relayer.</h3>
  </section>)


  // @TODO: visualize other pending bundles
  const firstPending = data && data.txns.find(x => !x.executed && !x.replaced)

  const mapToBundle = (relayerBundle, extra = {}) => (new Bundle({
    ...relayerBundle,
    nonce: relayerBundle.nonce.num,
    gasLimit: null,
    // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
    minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
    ...extra
  }))
  const cancelByReplacing = relayerBundle => showSendTxns(mapToBundle(relayerBundle, {
    txns: [[selectedAcc, '0x0', '0x']],
  }))
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
  const speedup = relayerBundle => showSendTxns(mapToBundle(relayerBundle, { txns: relayerBundle.txns.slice(0, -1) }))
  const replace = relayerBundle => showSendTxnsForReplacement(mapToBundle(relayerBundle))

  const paginationControls = (
    <div className='pagination-controls'>
      <div className='pagination-title'>Page</div>
      <Button clear mini onClick={() => page > 1 && setPage(page => page - 1)}><HiOutlineChevronLeft/></Button>
      <div className='pagination-current'>{ page } <span>/ { maxPages }</span></div>
      <Button clear mini onClick={() => page < maxPages && setPage(page => page + 1)}><HiOutlineChevronRight/></Button>
    </div>
  )

  return (
    <section id='transactions'>
      {!!eligibleRequests.length && (<div className='panel' id="waiting-transactions">
        <div className='panel-heading'>
          <div className='title'><FaSignature size={25}/>Waiting to be signed (current batch)</div>
        </div>
        <div className="content">
          <div className="bundle">
            <div className="bundle-list" onClick={() => showSendTxns(null)}>
              {eligibleRequests.map(req => (
                <TxnPreview
                    key={req.id}
                    network={selectedNetwork.id}
                    account={selectedAcc}
                    disableExpand={true}
                    txn={toBundleTxn(req.txn, selectedAcc)}/>
              ))}
            </div>
              <div className='actions'>
                {/*
                <Button small className='cancel' onClick={
                  () => resolveMany(eligibleRequests.map(x => x.id), { message: 'Ambire user rejected all requests' })
                }>Reject all</Button>*/}
                <Button small icon={<MdCheck/>} onClick={() => showSendTxns(null)}>Sign or reject</Button>
              </div>
          </div>
        </div>
      </div>)}
      { !!firstPending && (<div className='panel' id="pending">
        <div className='panel-heading'>
          <div className='title'><MdOutlinePendingActions/>Pending transaction bundle</div>
        </div>
        <div className="content">
          <div className="bundle">
            <BundlePreview bundle={firstPending} feeAssets={feeAssets}></BundlePreview>
            <div className='actions'>
              <Button small onClick={() => replace(firstPending)}>Replace or modify</Button>
              <Button small className='cancel' onClick={() => cancel(firstPending)}>Cancel</Button>
              <Button small onClick={() => speedup(firstPending)}>Speed up</Button>
            </div>
          </div>
        </div>
      </div>) }

      <div id="confirmed" className="panel">
        <div className="panel-heading">
          <div className='title'>
            <BsCheck2All/>
            {(data && data.txns.length === 0) ? 'No transactions yet.' : 'Confirmed transactions'}
          </div>
          { !bundlesList.length ? null : paginationControls }
        </div>
        <div className="content">
          {!relayerURL && (<h3 className='validation-error'>Unsupported: not currently connected to a relayer.</h3>)}
          {errMsg && (<h3 className='validation-error'>Error getting list of transactions: {errMsg}</h3>)}
          {
            isLoading && !data ? <Loading /> :
              !bundlesList.length ? null :
                <>
                  { bundlesList }
                  { paginationControls }
                </>
          }
        </div>
      </div>
    </section>
  )
}

function BundlePreview({ bundle, mined = false, feeAssets }) {
  const network = networks.find(x => x.id === bundle.network)
  if (!Array.isArray(bundle.txns)) return (<h3 className='error'>Bundle has no transactions (should never happen)</h3>)
  const lastTxn = bundle.txns[bundle.txns.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(lastTxn, bundle.network, bundle.identity)
  const hasFeeMatch = (bundle.txns.length > 1) && lastTxnSummary.match(new RegExp(TO_GAS_TANK, 'i'))
  const txns = hasFeeMatch ? bundle.txns.slice(0, -1) : bundle.txns
  const toLocaleDateTime = date => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  const feeTokenDetails = feeAssets ? feeAssets.find(i => i.symbol === bundle.feeToken) : null
  const savedGas = feeTokenDetails ? getAddedGas(feeTokenDetails) : null
  const splittedLastTxnSummary = lastTxnSummary.split(' ')
  const fee = splittedLastTxnSummary.length ? splittedLastTxnSummary[1] + ' ' + splittedLastTxnSummary[2] : []
  const cashback = (bundle.gasTankFee && bundle.gasTankFee.cashback && feeTokenDetails) ?
    (formatUnits(bundle.gasTankFee.cashback.toString(), feeTokenDetails?.decimals).toString() * feeTokenDetails?.price) : 0
  const totalSaved =  savedGas &&
    ((bundle.feeInUSDPerGas * savedGas) + cashback)

  return (<div className='bundlePreview bundle' key={bundle._id}>
    {
      txns.length > 2
      ? (
          <div>
            {
              bundle.expanded
              ?
              <div>
                {
                  txns.map((txn, i) => (<TxnPreview
                      key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
                      txn={txn} network={bundle.network} account={bundle.identity} mined={mined}
                      addressLabel={!!bundle.meta && bundle.meta.addressLabel}
                    />
                  ))
                }
                <div
                  className='bundleExpander bundleExpander-expanded'
                  onClick={() => {bundle.expand(false)}} >
                  <span className='expanderAction'><FaMinus /> Show less</span>
                </div>
              </div>
              :
              <div>
                <div className='halfVisibleTxns'>
                  {
                    txns.slice(0, 2).map((txn, i) => (<TxnPreview
                        key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
                        txn={txn} network={bundle.network} account={bundle.identity} mined={mined}
                        addressLabel={!!bundle.meta && bundle.meta.addressLabel}
                      />
                    ))
                  }
                </div>
                <div
                  className='bundleExpander bundleExpander-shrunk'
                  onClick={() => {bundle.expand(true)}} >
                    <span className='expanderAction'>
                      <FaPlus />
                      Show more
                    </span> <span className='expanderAction-details'>+ {txns.length - 2} transactions</span>
                </div>
              </div>
            }
          </div>
        )
      : txns.map((txn, i) => (<TxnPreview
            key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
            txn={txn} network={bundle.network} account={bundle.identity} mined={mined}
            addressLabel={!!bundle.meta && bundle.meta.addressLabel}
          />
        ))
    }

    <ul className="details">
      {
        hasFeeMatch ?
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
          <li>
              <label><BsCoin/>Fee (Paid with Gas Tank)</label>
              <p>${(bundle.feeInUSDPerGas * bundle.gasLimit).toFixed(6)}</p>
          </li>
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
            <p><a href={network.explorerUrl+'/tx/'+bundle.txId} target='_blank' rel='noreferrer'>{network.explorerUrl.split('/')[2]}</a></p>
          </li>
          :
          null
      }
    </ul>
  </div>)
}

export default Transactions
