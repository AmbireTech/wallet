import { useState, useEffect, useMemo, useRef } from 'react'
import cn from 'classnames'

import networks from 'consts/networks'

import { useRelayerData } from 'hooks'
import { useToasts } from 'hooks/toasts'
import useConstants from 'hooks/useConstants'
import useMovr from 'components/Wallet/CrossChain/useMovr'
import { Loading, Panel } from 'components/common'
import movrTxParser from './movrTxParser'
import TxStatus from './TxStatus/TxStatus'

import styles from './History.module.scss'

const History = ({ relayerURL, network, account, quotesConfirmed, panelClassName }) => {
  const {
    constants: { humanizerInfo }
  } = useConstants()
  const { addToast } = useToasts()
  const { checkTxStatus } = useMovr()

  const [txStatuses, setTxStatuses] = useState([])
  const [loading, setLoading] = useState(false)
  const [cacheBreak, setCacheBreak] = useState(() => Date.now())
  const currentNetwork = useRef(network.id)

  const getNetworkDetails = (chainId) => networks.find((n) => n.chainId === chainId)

  // @TODO refresh this after we submit a bundle; perhaps with the upcoming transactions service
  // We want this pretty much on every rerender with a 5 sec debounce
  useEffect(() => {
    if (Date.now() - cacheBreak > 5000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 10000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${account}/${network.id}/transactions?cacheBreak=${cacheBreak}`
    : null

  const { data: relayerTransactions, errMsg, isLoading: isRelayerLoading } = useRelayerData({ url })

  // Return relayer txs that contains outboundTransferTo calls to Movr contracts and parse them
  const txTransfers = useMemo(() => {
    if (network.id !== currentNetwork.current) return []

    const transactions =
      relayerTransactions && relayerTransactions.txns ? relayerTransactions.txns : []
    return transactions
      .map(({ txId, txns }) => {
        const outboundTransferTo = txns
          .map(([, value, data]) => {
            const sigHash = data.slice(0, 10)
            const parseOutboundTransferTo = movrTxParser(humanizerInfo)[sigHash]
            if (parseOutboundTransferTo)
              return {
                txData: data,
                ...parseOutboundTransferTo(value, data, network)
              }
            return null
          })
          .filter((call) => call)

        return outboundTransferTo.length
          ? {
              hash: txId,
              ...outboundTransferTo[0]
            }
          : null
      })
      .filter((tx) => tx)
  }, [relayerTransactions, network, humanizerInfo])

  useEffect(() => {
    async function getStatuses() {
      const statuses = await Promise.all(
        txTransfers.map(async ({ hash, txData, from, to }) => {
          const storedQuote = quotesConfirmed.find((q) => q.txData === txData)
          const serviceTimeMinutes = storedQuote ? storedQuote.serviceTimeMinutes || null : null
          const fromNetwork = getNetworkDetails(from.chainId)
          const toNetwork = getNetworkDetails(to.chainId)

          try {
            const status = await checkTxStatus(hash, from.chainId, to.chainId)
            return {
              ...status,
              sourceTx: status.sourceTransactionHash,
              from,
              to: storedQuote ? storedQuote.to || null : to,
              serviceTimeMinutes,
              fromNetwork,
              toNetwork,
              isPending: !(
                status.sourceTxStatus === 'COMPLETED' && status.destinationTxStatus === 'COMPLETED'
              )
            }
          } catch (e) {
            console.error(e)
            addToast('Cross-Chain History: Unable to fetch transfer status.', { error: true })
            return {
              sourceTx: hash,
              from,
              to,
              serviceTimeMinutes,
              fromNetwork,
              toNetwork,
              statusError: true
            }
          }
        })
      )

      if (network.id !== currentNetwork.current) return
      setTxStatuses(statuses)
    }

    getStatuses()
  }, [txTransfers, quotesConfirmed, network, checkTxStatus, addToast])

  useEffect(() => {
    if (!errMsg) return
    console.error(errMsg)
    addToast(`Cross-Chain History: ${errMsg}`, { error: true })
  }, [errMsg, addToast])

  useEffect(() => {
    setLoading(isRelayerLoading && !txStatuses.length)
  }, [isRelayerLoading, txStatuses])

  useEffect(() => {
    currentNetwork.current = network.id
    setTxStatuses([])
    setCacheBreak(Date.now())
  }, [network])

  return (
    <Panel className={cn(panelClassName, styles.wrapper)} title="History">
      {loading ? (
        <Loading />
      ) : !txStatuses.length ? (
        <div>No pending transfer/swap on this network.</div>
      ) : (
        <div className={styles.txStatuses}>
          {txStatuses.map((data) => (
            <TxStatus key={data.sourceTx} data={data} />
          ))}
        </div>
      )}
    </Panel>
  )
}

export default History
