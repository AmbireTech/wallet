import './History.scss'

import { useState, useEffect } from 'react'
import { MdOutlineArrowForward, MdOutlineCheck, MdOutlineClose } from 'react-icons/md'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { Loading } from '../../../common'
import { checkTxStatus } from '../../../../services/movr'
import networks from '../../../../consts/networks'
import { useToasts } from '../../../../hooks/toasts'

const History = ({ network, sentTxn, quotesConfirmed }) => {
    const { addToast } = useToasts()
    const [txStatuses, setTxStatuses] = useState([])

    const getNetworkDetails = chainId => networks.find(n => n.chainId === chainId)
    const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)

    useEffect(() => {
        async function getStatuses() {
            const quotesConfirmedRequestIds = quotesConfirmed.map(({ id }) => id)
            const quotesConfirmedSent = sentTxn
                .filter(sent => sent.network === network.id && sent?.requestIds.some(id => quotesConfirmedRequestIds.includes(id)))

            const statuses = await Promise.all(quotesConfirmedSent.map(async ({ hash, requestIds }) => {
                const { from, to } = quotesConfirmed.find(({ id }) => requestIds.includes(id))
                const fromNetwork = getNetworkDetails(from.chainId)
                const toNetwork = getNetworkDetails(to.chainId)

                try {
                    const status = await checkTxStatus(hash, from.chainId, to.chainId)
                    return {
                        ...status,
                        from,
                        to,
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
                        fromNetwork,
                        toNetwork,
                        statusError: true
                    }
                }
            }))

            setTxStatuses(statuses)
        }
        getStatuses()
    }, [sentTxn, quotesConfirmed, network.id, addToast])

    return (
        <div id="history" className="panel">
            <div className="title">
               History
            </div>
            <div>
                {
                    !txStatuses.length ?
                        <div>No pending transfer/swap on this network.</div>
                        :
                        txStatuses.map(({ sourceTx, fromNetwork, toNetwork, from, to, isPending, statusError }) => (
                            <div className="tx-status" key={sourceTx}>
                                <div className="summary">
                                    <div className="path">
                                        <div className="network">
                                            <div className="icon" style={{backgroundImage: `url(${fromNetwork.icon})`}}></div>
                                            <div className="name">{ fromNetwork.name }</div>
                                        </div>
                                        <div className="amount">
                                            { formatAmount(from?.amount, from.asset) }
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
                                            { formatAmount(to?.amount, to.asset) }
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
        </div>
    )
}

export default History