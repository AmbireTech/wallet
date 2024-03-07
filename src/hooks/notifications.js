import { useCallback, useRef, useEffect } from 'react'
import { getTransactionSummary } from 'lib/humanReadableTransactions'
import { BigNumber } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import networks from 'consts/networks'
import AMBIRE_ICON from 'resources/icon.png'
import { getProvider } from 'ambire-common/src/services/provider'
import { useToasts } from './toasts'
import useConstants from './useConstants'

const REQUEST_TITLE_PREFIX = 'Ambire Wallet: '
const SUPPORTED_TYPES = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_sign',
  'eth_sendRawTransaction',
  'eth_signTransaction',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4'
]
const BALANCE_TRESHOLD = 1.00002
let currentNotifs = []
let isLastTotalBalanceInit = false
let lastTokensBalanceRaw = []

const getAmountReceived = (lastToken, newBalanceRaw, decimals) => {
  try {
    const lastBalanceRaw = lastToken
      ? lastToken.latest
        ? lastToken.latest.balanceRaw
        : lastToken.balanceRaw
      : ''
    const amountRecieved = lastToken
      ? BigNumber.from(newBalanceRaw.toString(10)).sub(BigNumber.from(lastBalanceRaw.toString(10)))
      : newBalanceRaw
    return formatUnits(amountRecieved, decimals)
  } catch (e) {
    console.error(`Notifications: ${e}`)
  }
}

export default function useNotifications(
  requests,
  onShow,
  portfolio,
  selectedAcc,
  network,
  sentTxn,
  confirmSentTx
) {
  const {
    constants: { humanizerInfo, tokenList }
  } = useConstants()
  const { addToast } = useToasts()
  const onShowRef = useRef({})
  onShowRef.current.onShow = onShow

  useEffect(() => {
    // hack because for whatever reason it doesn't work when we access the ref directly
    window.onClickNotif = (req) => onShowRef.current.onShow(req)
  }, [])

  // Shared code for all notifications
  const showNotification = useCallback(
    ({ id, title, body, requireInteraction, request, onClick }) => {
      try {
        const notification = new Notification(title, {
          requireInteraction: requireInteraction || false,
          body,
          icon: AMBIRE_ICON
        })
        // notification.onclose =
        notification.onclick =
          onClick ||
          (() => {
            if (request && request.type === 'eth_sendTransaction') window.onClickNotif(request)
            window.focus()
            notification.close()
          })
        currentNotifs.push({ id, notification })
      } catch (e) {
        console.error(e)
      }
    },
    []
  )

  // Signing request notifications
  requests.forEach((request) => {
    // only requests we actually want a notification for
    if (!request.notification) return
    if (!SUPPORTED_TYPES.includes(request.type)) return
    if (currentNotifs.find((n) => n.id === request.id)) return
    if (!request.txn) return
    const isSendTxn = request.type === 'eth_sendTransaction'
    const network = networks.find((x) => x.chainId === request.chainId)
    const title =
      REQUEST_TITLE_PREFIX +
      (isSendTxn
        ? `new transaction request on ${network ? network.name : 'unknown network'}`
        : 'you have a new message to sign')

    const body = isSendTxn
      ? getTransactionSummary(
          humanizerInfo,
          tokenList,
          [request.txn.to, request.txn.value, request.txn.data],
          request.chainId,
          request.account
        )
      : 'Click to preview'

    showNotification({
      id: request.id,
      title,
      body,
      request,
      requireInteraction: true
    })
  })

  // Balance notifications
  useEffect(() => {
    try {
      if (!portfolio.isCurrNetworkBalanceLoading && portfolio.balance) {
        if (!isLastTotalBalanceInit) {
          isLastTotalBalanceInit = true
          lastTokensBalanceRaw = portfolio.tokens
            .filter((t) => !t.pending || !t.unconfirmed)
            .map(({ address, balanceRaw, latest, pending, unconfirmed }) => ({
              address,
              balanceRaw,
              latest,
              pending,
              unconfirmed
            }))
        }

        const changedAmounts = portfolio.tokens.filter(
          ({ address, balanceRaw, latest, pending, unconfirmed }) => {
            const lastToken = lastTokensBalanceRaw.find((token) => token.address === address)
            const currentBalance = latest ? latest.balanceRaw : balanceRaw

            const lastTokenBalance =
              lastToken && lastToken.latest ? lastToken.latest.balanceRaw : lastToken?.balanceRaw

            const isSignificantChange =
              lastToken && currentBalance / lastTokenBalance > BALANCE_TRESHOLD
            return (!lastToken && !pending && !unconfirmed) || isSignificantChange
          }
        )

        changedAmounts.forEach(
          ({ address, symbol, decimals, balanceRaw, latest, pending, unconfirmed }) => {
            const newBalance = latest ? latest.balanceRaw : balanceRaw
            const lastToken = lastTokensBalanceRaw.find((token) => token.address === address)
            const amountRecieved = getAmountReceived(lastToken, newBalance, decimals)

            showNotification({
              id: `received_amount_${Date.now()}`,
              title: `${amountRecieved} ${symbol} Received.`,
              body: `Your ${symbol} balance increased by ${amountRecieved} ${symbol}`
            })

            lastToken
              ? (lastTokensBalanceRaw = [
                  ...lastTokensBalanceRaw.filter((token) => token.address !== address),
                  { address, balanceRaw, latest, pending, unconfirmed }
                ])
              : lastTokensBalanceRaw.push({ address, balanceRaw, latest, pending, unconfirmed })
          }
        )
      }
    } catch (e) {
      console.error(e)
      addToast(e.message | e, { error: true })
    }
  }, [portfolio, addToast, showNotification])

  // Tx mined notifications
  useEffect(() => {
    const interval = network.id === 'ethereum' ? 30000 : 10000
    const txStatusInterval = setInterval(() => {
      sentTxn
        .filter(({ confirmed }) => !confirmed)
        .forEach(async ({ hash }) => {
          const provider = getProvider(network.id)
          try {
            const txReceipt = await provider.getTransactionReceipt(hash)
            if (!txReceipt) return

            confirmSentTx(hash)
            showNotification({
              id: `confirmed_tx_${Date.now()}`,
              title: 'Ambire Transaction Confirmed',
              body: 'Your transaction was successfully confirmed!',
              onClick: () => window.open(`${network.explorerUrl}/tx/${hash}`, '_blank')
            })
          } catch (e) {
            console.error(e)
          }
        })
    }, interval)
    return () => clearInterval(txStatusInterval)
  }, [sentTxn, network, showNotification, confirmSentTx])

  useEffect(() => {
    isLastTotalBalanceInit = false
    lastTokensBalanceRaw = []
    // Reset data on component unmount
    return () => {
      isLastTotalBalanceInit = false
      lastTokensBalanceRaw = []
    }
  }, [selectedAcc, network])

  currentNotifs = currentNotifs.filter(({ id, notification }) => {
    if (!requests.find((r) => r.id === id)) {
      notification.close()
      return false
    }
    return true
  })
}
