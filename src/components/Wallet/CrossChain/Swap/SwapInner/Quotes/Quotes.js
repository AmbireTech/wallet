import { useMemo, useState } from 'react'
import cn from 'classnames'

import networks from 'consts/networks'

import { useToasts } from 'hooks/toasts'
import { Button, Loading } from 'components/common'
import useMovr from 'components/Wallet/CrossChain/useMovr'
import Header from './Header/Header'
import Routes from './Routes/Routes'

import styles from './Quotes.module.scss'

const formatAmount = (amount, asset) => amount / 10 ** asset.decimals
const formatFeeAmount = (fee, route) => {
  return formatAmount(fee.amount, fee.asset)
}
const getNetwork = (id) => networks.find(({ chainId }) => chainId === id)

const Quotes = ({
  addRequest,
  selectedAccount,
  fromTokensItems,
  quotes,
  onQuotesConfirmed,
  onCancel,
  amount
}) => {
  const { addToast } = useToasts()
  const { approvalBuildTx, sendBuildTx } = useMovr()

  const { toAsset } = quotes
  const fromAsset = fromTokensItems.find(({ value }) => value === quotes.fromAsset.address)
  const fromNetwork = getNetwork(quotes.fromAsset.chainId)
  const toNetwork = getNetwork(toAsset.chainId)
  const [selectedRoute, setSelectedRoute] = useState(null)
  const [loading, setLoading] = useState(false)

  const refuel = quotes.refuel
  const routes = useMemo(
    () =>
      quotes.routes.map((route) => {
        const { userTxs } = route

        const bridgeRoute = userTxs.find((tx) => tx.steps.find((s) => s.type === 'bridge'))
        const bridgeStep = bridgeRoute.steps?.find((s) => s.type === 'bridge')

        const middlewareRoute = userTxs.find((tx) => tx.steps.find((s) => s.type === 'middleware'))
        const middlewareStep = middlewareRoute?.steps?.find((s) => s.type === 'middleware')

        return {
          ...route,
          bridgeStep,
          middlewareStep,
          userTxType: bridgeRoute.userTxType,
          txType: bridgeRoute.txType,
          middlewareFee: middlewareStep?.protocolFees
            ? formatFeeAmount(middlewareStep?.protocolFees, route)
            : 0,
          bridgeFee: bridgeStep?.protocolFees
            ? formatFeeAmount(bridgeStep?.protocolFees, route)
            : 0,
          fromAsset,
          toAsset
        }
      }),
    [fromAsset, quotes.routes, toAsset]
  )

  const sendTx = (id, chainId, to, data, value = '0x00') => {
    addRequest({
      id,
      dateAdded: new Date().valueOf(),
      chainId,
      account: selectedAccount,
      type: 'eth_sendTransaction',
      txn: {
        to,
        data,
        value
      }
    })
  }

  const onConfirm = async () => {
    setLoading(true)

    try {
      const route = routes.find(({ routeId }) => routeId === selectedRoute)

      const approvalTxn = await Promise.all(
        route.userTxs
          .filter((tx) => tx?.approvalData)
          .map((tx) => {
            return approvalBuildTx(
              route.bridgeStep.fromChainId,
              selectedAccount,
              tx?.approvalData?.allowanceTarget,
              tx?.approvalData?.approvalTokenAddress,
              tx?.approvalData?.minimumApprovalAmount
            )
          })
      )

      approvalTxn.map((tx) =>
        sendTx(
          `transfer_approval_crosschain_${Date.now()}`,
          route.bridgeStep.fromChainId,
          tx.to,
          tx.data
        )
      )

      const tx = await sendBuildTx(route, refuel)
      sendTx(
        `transfer_send_crosschain_${Date.now()}`,
        route.bridgeStep.fromChainId,
        tx.txTarget,
        tx.txData,
        tx.value
      )

      const serviceTimeMinutes = new Date(
        (route?.serviceTime || 0) + (route?.serviceTime || 0)
      ).getMinutes()
      onQuotesConfirmed({
        txData: tx.txData,
        serviceTimeMinutes,
        to: {
          chainId: toAsset.chainId,
          asset: toAsset,
          amount: route.toAmount
        }
      })
      setLoading(false)
      onCancel()
    } catch (e) {
      console.error(e)
      addToast(e.message || e, { error: true })
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div>
        <Header
          fromNetwork={fromNetwork}
          fromAsset={fromAsset}
          toNetwork={toNetwork}
          toAsset={toAsset}
          amount={amount}
        />

        {loading ? <Loading /> : <Routes routes={routes} setSelectedRoute={setSelectedRoute} />}
      </div>

      <div className={cn(styles.buttons, styles.singleButton)}>
        <Button disabled={loading} onClick={onCancel} className={styles.button}>
          {routes.length ? 'Cancel' : 'Go Back'}
        </Button>
        {routes.length ? (
          <Button
            variant="primaryGradient"
            disabled={!selectedRoute || loading}
            onClick={onConfirm}
            className={styles.button}
          >
            Confirm
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export default Quotes
