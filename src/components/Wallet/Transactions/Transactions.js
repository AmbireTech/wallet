import { useRelayerData, useLocalStorage } from 'hooks'
import TxnPreview from 'components/common/TxnPreview/TxnPreview'
import { Loading, Button } from 'components/common'
import { Bundle } from 'adex-protocol-eth'
import { useCallback, useEffect, useMemo, useState } from 'react'
import fetch from 'node-fetch'
import { useToasts } from 'hooks/toasts'
import { toBundleTxn } from 'ambire-common/src/services/requestToBundleTxn'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min'
import cn from 'classnames'
import { ReactComponent as SignedMsgActiveIcon } from './images/signed-messages-active.svg'
import { ReactComponent as SignedMsgInactiveIcon } from './images/signed-messages-inactive.svg'
import { ReactComponent as WaitingTxsIcon } from './images/waiting.svg'
import { ReactComponent as PendingTxsIcon } from './images/pending.svg'
import { ReactComponent as ConfirmedActiveTxsIcon } from './images/confirmed-active.svg'
import { ReactComponent as ConfirmedInactiveTxsIcon } from './images/confirmed-inactive.svg'
import SignedMessages from './SignedMessages/SignedMessages'
import BundlePreview from './BundlePreview/BundlePreview'

import styles from './Transactions.module.scss'

// 10% in geth and most EVM chain RPCs; relayer wants 12%
const RBF_THRESHOLD = 1.14
const ITEMS_PER_PAGE = 8

function Transactions({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  showSendTxns,
  addRequest,
  eligibleRequests,
  setSendTxnState,
  privateMode,
  showMessagesView
}) {
  const { addToast } = useToasts()
  const history = useHistory()
  const params = useParams()
  const [showMessages, setShowMessages] = useState(false)
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())

  // @TODO refresh this after we submit a bundle; perhaps with the upcoming transactions service
  // We want this pretty much on every rerender with a 5 sec debounce
  useEffect(() => {
    if (Date.now() - cacheBreak > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 10000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/transactions?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData({ url })
  const urlGetFeeAssets = relayerURL
    ? `${relayerURL}/gas-tank/assets?cacheBreak=${cacheBreak}`
    : null
  const { data: feeAssets } = useRelayerData({ url: urlGetFeeAssets })

  const showSendTxnsForReplacement = useCallback(
    (bundle) => {
      bundle.txns.forEach((txn, index) => {
        addRequest({
          id: `replace_${index}`,
          dateAdded: new Date().valueOf(),
          chainId: selectedNetwork.chainId,
          account: selectedAcc,
          type: 'eth_sendTransaction',
          txn: {
            to: txn[0].toLowerCase(),
            value: txn[1] === '0x' ? '0x0' : txn[1],
            data: txn[2]
          }
        })
      })

      setSendTxnState({ showing: true, replaceByDefault: true, mustReplaceNonce: bundle.nonce })
    },
    [addRequest, selectedNetwork, selectedAcc, setSendTxnState]
  )

  const maxBundlePerPage = 10
  const executedTransactions = data ? data.txns.filter((x) => x.executed) : []

  const [messages] = useLocalStorage({
    storage: useLocalStorage,
    key: 'signedMessages',
    defaultValue: []
  })

  const filteredMessages = useMemo(
    () =>
      messages
        .filter((m) => m.accountId === selectedAcc && m.networkId === selectedNetwork.chainId)
        .sort((a, b) => b.date - a.date),
    [messages, selectedNetwork, selectedAcc]
  )

  const maxPages = showMessages
    ? Math.ceil(filteredMessages.length / ITEMS_PER_PAGE)
    : Math.ceil(executedTransactions.length / maxBundlePerPage)

  const defaultPage = useMemo(
    () => Math.min(Math.max(Number(params.page), 1), maxPages) || 1,
    [params.page, maxPages]
  )
  const [page, setPage] = useState(defaultPage)

  const bundlesList = executedTransactions
    .slice((page - 1) * maxBundlePerPage, page * maxBundlePerPage)
    .map((bundle) => <BundlePreview bundle={bundle} mined feeAssets={feeAssets} />)

  useEffect(
    () =>
      !isLoading &&
      (showMessages
        ? history.replace(`/wallet/transactions/messages/${page}`)
        : history.replace(`/wallet/transactions/${page}`)),
    [page, history, isLoading, showMessages]
  )
  useEffect(() => setPage(defaultPage), [selectedAcc, selectedNetwork, defaultPage])

  // @TODO implement a service that stores sent transactions locally that will be used in relayerless mode
  // if (!relayerURL) return (<section className={cn(styles.transactions)}>
  //   <h3 className={cn(styles.validationError)}>Unsupported: not currently connected to a relayer.</h3>
  // </section>)

  // Removed fee txn if Gas tank is not used for payment method
  const removeFeeTxnFromBundleIfGasTankDisabled = (bundle) =>
    !bundle.gasTankFee ? { ...bundle, txns: bundle.txns.slice(0, -1) } : bundle

  // @TODO: visualize other pending bundles
  const allPending = data && data.txns.filter((x) => !x.executed && !x.replaced)
  const firstPending = allPending && allPending[0]

  const mapToBundle = (relayerBundle, extra = {}) =>
    new Bundle({
      ...relayerBundle,
      nonce: relayerBundle.nonce.num,
      gasLimit: null,
      // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
      minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
      ...extra
    })
  const cancelByReplacing = (relayerBundle) =>
    setSendTxnState({
      showing: true,
      replacementBundle: mapToBundle(relayerBundle, {
        txns: [[selectedAcc, '0x0', '0x']]
      }),
      mustReplaceNonce: relayerBundle.nonce.num
    })
  const cancel = (relayerBundle) => {
    // @TODO relayerless
    mapToBundle(relayerBundle)
      .cancel({ relayerURL, fetch })
      .then(({ success, message }) => {
        if (!success) {
          if (message.includes('not possible to cancel')) {
            addToast(
              'Transaction already picked up by the network, you will need to pay a fee to replace it with a cancellation transaction.'
            )
          } else {
            addToast(
              `Not possible to cancel: ${message}, you will need to pay a fee to replace it with a cancellation transaction.`
            )
          }
          cancelByReplacing(relayerBundle)
        } else {
          addToast('Transaction cancelled successfully')
        }
      })
      .catch((e) => {
        console.error(e)
        cancelByReplacing(relayerBundle)
      })
  }

  // @TODO: we are currently assuming the last txn is a fee; change that (detect it)
  const speedup = (relayerBundle) =>
    setSendTxnState({
      showing: true,
      replacementBundle: mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)),
      mustReplaceNonce: relayerBundle.nonce.num
    })
  const replace = (relayerBundle) =>
    showSendTxnsForReplacement(mapToBundle(removeFeeTxnFromBundleIfGasTankDisabled(relayerBundle)))

  const paginationControls = (
    <div className={styles.paginationControls}>
      <div className={styles.paginationTitle}>Page</div>
      <Button
        clear
        mini
        className={styles.paginationButton}
        onClick={() => page > 1 && setPage((page) => page - 1)}
      >
        <HiOutlineChevronLeft />
      </Button>
      <div className={styles.paginationCurrent}>
        {page} <span>/ {maxPages}</span>
      </div>
      <Button
        clear
        mini
        className={styles.paginationButton}
        onClick={() => page < maxPages && setPage((page) => page + 1)}
      >
        <HiOutlineChevronRight />
      </Button>
    </div>
  )

  return (
    <section className={styles.transactions}>
      {!!eligibleRequests.length && (
        <div className={cn(styles.panel, styles.waitingTransactions)}>
          <div className={styles.panelHeading}>
            <div className={styles.title}>
              <WaitingTxsIcon />
              Waiting to be signed (current batch)
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.bundle}>
              <div className={styles.bundleList} onClick={() => showSendTxns(null)}>
                {eligibleRequests.map((req) => (
                  <TxnPreview
                    key={req.id}
                    network={selectedNetwork.id}
                    account={selectedAcc}
                    disableExpand
                    txn={toBundleTxn(req.txn, selectedAcc)}
                  />
                ))}
              </div>
              <div className={styles.actions}>
                {/*
                <Button small className='cancel' onClick={
                  () => resolveMany(eligibleRequests.map(x => x.id), { message: 'Ambire user rejected all requests' })
                }>Reject all</Button> */}
                <Button
                  small
                  primaryGradient
                  className={styles.gradient}
                  onClick={() => showSendTxns(null)}
                >
                  Sign or Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!!firstPending && (
        <div className={cn(styles.panel, styles.pending)}>
          <div className={styles.panelHeading}>
            <div className={styles.title}>
              <PendingTxsIcon />
              Pending transactions
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.bundle}>
              <BundlePreview bundle={firstPending} feeAssets={feeAssets} />
              <div className={styles.actions}>
                <Button small className={styles.cancel} onClick={() => cancel(firstPending)}>
                  Cancel
                </Button>
                <Button small className={styles.speedUp} onClick={() => speedup(firstPending)}>
                  Speed up
                </Button>
                <Button
                  small
                  primaryGradient
                  className={styles.gradient}
                  onClick={() => replace(firstPending)}
                >
                  Replace or Modify
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {allPending && allPending.length > 1 && (
        <h4>NOTE: There are a total of {allPending.length} pending transaction bundles.</h4>
      )}

      <div className={cn(styles.panel, styles.confirmed)}>
        <div className={styles.panelHeading}>
          <div className={styles.buttons}>
            <div className={styles.title}>
              {showMessages ? <ConfirmedInactiveTxsIcon /> : <ConfirmedActiveTxsIcon />}
              <button
                className={
                  showMessages
                    ? cn(styles.inactive, styles.txnBtn)
                    : cn(styles.active, styles.txnBtn)
                }
                onClick={() => {
                  setShowMessages(false)
                  setPage(1)
                }}
              >
                Confirmed Transactions
              </button>
            </div>
            <div className={styles.title}>
              {showMessages ? <SignedMsgActiveIcon /> : <SignedMsgInactiveIcon />}
              <button
                className={
                  showMessages
                    ? cn(styles.active, styles.msgBtn)
                    : cn(styles.inactive, styles.msgBtn)
                }
                onClick={() => {
                  setShowMessages(true)
                  setPage(1)
                }}
              >
                Signed Messages
              </button>
            </div>
          </div>
          <div className={styles.topPagination}>{maxPages >= 1 ? paginationControls : null}</div>
        </div>
        {!showMessages && (
          <div className={styles.content}>
            {!relayerURL && (
              <h3 className={styles.validationError}>
                Unsupported: not currently connected to a relayer.
              </h3>
            )}
            {errMsg && (
              <h3 className={styles.validationError}>
                Error getting list of transactions: {errMsg}
              </h3>
            )}
            {isLoading && !data ? <Loading /> : !bundlesList.length ? null : <>{bundlesList}</>}
          </div>
        )}
        {showMessages && (
          <SignedMessages
            filteredMessages={filteredMessages}
            privateMode={privateMode}
            page={page}
            selectedAcc={selectedAcc}
            selectedNetwork={selectedNetwork}
          />
        )}
        <div className={styles.bottomPagination}>{maxPages >= 1 ? paginationControls : null}</div>
      </div>
    </section>
  )
}

export default Transactions
