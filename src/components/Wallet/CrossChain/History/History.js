import './History.scss'

import { useState, useEffect, useMemo, useRef } from 'react'
import { MdOutlineArrowForward, MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { Loading, Panel } from 'components/common'
import useMovr from 'components/Wallet/CrossChain/useMovr'
import networks from 'consts/networks'
import { useToasts } from 'hooks/toasts'
import { useRelayerData } from 'hooks'
import movrTxParser from './movrTxParser'

const History = ({ relayerURL, network, account, quotesConfirmed }) => {
    const { addToast } = useToasts()
    const { checkTxStatus } = useMovr()

    const [txStatuses, setTxStatuses] = useState([])
    const [loading, setLoading] = useState(false)
    const [cacheBreak, setCacheBreak] = useState(() => Date.now())
    const currentNetwork = useRef(network.id)

    const getNetworkDetails = chainId => networks.find(n => n.chainId === chainId)
    const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)

    // @TODO refresh this after we submit a bundle; perhaps with the upcoming transactions service
    // We want this pretty much on every rerender with a 5 sec debounce
    useEffect(() => {
        if ((Date.now() - cacheBreak) > 5000) setCacheBreak(Date.now())
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

        const transactions = relayerTransactions && relayerTransactions.txns ? relayerTransactions.txns : []
        return transactions.map(({ txId, txns }) => {
            const outboundTransferTo = txns.map(([, value, data]) => {
                const sigHash = data.slice(0, 10)
                const parseOutboundTransferTo = movrTxParser[sigHash]
                if (parseOutboundTransferTo) return {
                    txData: data,
                    ...parseOutboundTransferTo(value, data, network)
                }
                return null
            }).filter(call => call)

            return outboundTransferTo.length ? {
                hash: txId,
                ...outboundTransferTo[0]
            } : null
        }).filter(tx => tx)
    }, [relayerTransactions, network])

    useEffect(() => {
        async function getStatuses() {
            const statuses = await Promise.all(txTransfers.map(async ({ hash, txData, from, to }) => {
                const storedQuote = quotesConfirmed.find(q => q.txData === txData)
                const serviceTimeMinutes = storedQuote ? storedQuote.serviceTimeMinutes || null : null
                const fromNetwork = getNetworkDetails(from.chainId)
                const toNetwork = getNetworkDetails(to.chainId)

                try {
                    const status = await checkTxStatus(hash, from.chainId, to.chainId)
                    return {
                        ...status,
                        from,
                        to: storedQuote ? storedQuote.to || null : to,
                        serviceTimeMinutes,
                        fromNetwork,
                        toNetwork,
                        isPending: !(status.sourceTxStatus === 'COMPLETED' && status.destinationTxStatus === 'COMPLETED')
                    }
                } catch(e) {
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
            }))

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
        <Panel id="history" className="panel" title="History">
            <div>
                {
                    loading ?
                        <Loading/>
                        :
                        !txStatuses.length ?
                            <div>No pending transfer/swap on this network.</div>
                            :
                            txStatuses.map(({ sourceTx, fromNetwork, toNetwork, from, to, serviceTimeMinutes, isPending, statusError }) => (
                                <div className="tx-status" key={sourceTx}>
                                    <div className="summary">
                                        <div className="path">
                                            <div className="network">
                                                <div className="icon" style={{backgroundImage: `url(${fromNetwork.icon})`}}></div>
                                                <div className="name">{ fromNetwork.name }</div>
                                            </div>
                                            <div className="amount">
                                                { from.amount ? formatAmount(from.amount, from.asset) : '' }
                                                <div className="asset">
                                                    <div className="icon" style={{backgroundImage: `url(${from?.asset?.icon})`}}></div>
                                                    <div className="name">{ from?.asset?.symbol }</div>
                                                </div>
                                            </div>
                                        </div>
                                        <MdOutlineArrowForward/>
                                        <div className="path">
                                            <div className="network">
                                                <div className="icon" style={{backgroundImage: `url(${toNetwork.icon})`}}></div>
                                                <div className="name">{ toNetwork.name }</div>
                                            </div>

                                            <div className="amount">
                                                { to.amount ? formatAmount(to.amount, to.asset) : '' }
                                                <div className="asset">
                                                    <div className="icon" style={{backgroundImage: `url(${to?.asset?.icon})`}}></div>
                                                    <div className="name">{ to?.asset?.symbol }</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="details">
                                        <a href={`${fromNetwork.explorerUrl}/tx/${sourceTx}`} target="_blank" rel="noreferrer">View on Block Explorer <HiOutlineExternalLink/></a>
                                        {
                                            statusError ? 
                                                <div className="status error">
                                                    <MdOutlineClose/>
                                                    Could not fetch status
                                                </div>
                                                :
                                                isPending ? 
                                                    <div className="status pending">
                                                        <Loading/>
                                                        Pending
                                                        <span>(Usually takes { serviceTimeMinutes || 20 } minutes)</span>
                                                    </div>
                                                    :
                                                    <div className="status confirmed">
                                                        <MdOutlineCheck/>
                                                        Confirmed
                                                    </div>
                                        }
                                    </div>
                                </div>
                            ))
                }
            </div>
        </Panel>
    )
}

export default History
