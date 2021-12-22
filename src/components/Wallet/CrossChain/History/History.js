import './History.scss'

import { useState, useEffect } from 'react'
import { MdOutlineArrowForward, MdOutlineCheck } from 'react-icons/md'
import { HiOutlineExternalLink } from 'react-icons/hi'
import { Loading } from '../../../common'
import { checkTxStatus } from '../../../../services/movr'
import networks from '../../../../consts/networks'

const History = ({ network, sentTxn, quotesConfirmed }) => {
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
                const status = await checkTxStatus(hash, from.chainId, to.chainId)
                return {
                    ...status,
                    from,
                    to,
                    fromNetwork: getNetworkDetails(from.chainId),
                    toNetwork: getNetworkDetails(to.chainId),
                    isPending: !(status.sourceTxStatus === 'COMPLETED' && status.destinationTxStatus === 'COMPLETED')
                }
            }))

            setTxStatuses(statuses)
        }
        getStatuses()
    }, [sentTxn, quotesConfirmed, network.id])

    return (
        <div id="history" className="panel">
            <div className="title">
                Transfer / Swaps History
            </div>
            <div>
                {
                    !txStatuses.length ?
                        <div>No pending transfer/swap on this network.</div>
                        :
                        txStatuses.map(({ sourceTx, fromNetwork, toNetwork, from, to, isPending }) => (
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