import './Quotes.scss'

import { MdOutlineArrowBack, MdOutlineArrowForward, MdOutlineCheck, MdOutlineClose } from 'react-icons/md';
import { Button, Loading, Radios } from 'components/common';
import { useState } from 'react';
import networks from 'consts/networks';
import useMovr from 'components/Wallet/CrossChain/useMovr';
import { useToasts } from 'hooks/toasts';


const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)
const formatFeeAmount = (fee, route) => {
    // console.log({fee, route})
    // const asset = fee.asset.address === route.toAsset.address ? fee.toAsset : route.fromAsset
    return formatAmount(fee.amount, fee.asset)
}
const getNetwork = id => networks.find(({ chainId }) => chainId === id)

const Quotes = ({ addRequest, selectedAccount, fromTokensItems, quotes, onQuotesConfirmed, onCancel }) => {
    const { addToast } = useToasts()
    const { approvalBuildTx, sendBuildTx } = useMovr()

    const { toAsset } = quotes;
    const fromAsset = fromTokensItems.find(({ value }) => value === quotes.fromAsset.address)
    const fromNetwork = getNetwork(quotes.fromAsset.chainId)
    const toNetwork = getNetwork(toAsset.chainId)
    const [selectedRoute, setSelectedRoute] = useState(null)
    const [loading, setLoading] = useState(false)
console.log({quotes});
    const refuel = quotes.refuel
    const routes = quotes.routes.map(route => {
        const { userTxs } = route
        const bridgeStep = userTxs.map(tx => tx.steps.find(s => s.type === 'bridge')).find(x => x)
        const bridgeRoute = userTxs.find(tx => tx.steps.find(s => s.type === 'bridge'))
        return {
            ...route,
            bridgeStep,
            userTxType: bridgeRoute.userTxType,
            txType: bridgeRoute.txType,
            middlewareFee: 0, // middlewareRoute ? formatFeeAmount(fees.middlewareFee, middlewareRoute) : 0,
            bridgeFee: bridgeStep?.protocolFees ? formatFeeAmount(bridgeStep?.protocolFees, route) : 0
        }
    })

    const radios = routes.map(({ bridgeStep, bridgeFee, maxServiceTime, fromAmount, toAmount, routeId, integratorFee, userTxs }) => ({
        label:
            <div className="route">
                <div className="info">
                    {/* {
                        middlewareRoute ?
                            <div className="middleware">
                                <div className="icon" style={{backgroundImage: `url(${middlewareRoute.middlewareInfo.icon})`}}></div>
                                <div className="name">{ middlewareRoute.middlewareInfo.displayName }</div>
                            </div>
                            :
                            null
                    } */}
                    <div className="bridge">
                        <div className="icon" style={{backgroundImage: `url(${bridgeStep.protocol.icon})`}}></div>
                        <div className="name">{ bridgeStep.protocol.displayName }</div>
                    </div>
                </div>
                <div className="summary">
                    <div className="time">{ ` ${maxServiceTime/60} estimation in minutes` }</div>
                    <div className="amounts">
                        {/* {
                            middlewareRoute ?
                                <div className="amount">
                                    { formatAmount(middlewareRoute.inputAmount, middlewareRoute.fromAsset) } { middlewareRoute.fromAsset.symbol }
                                </div>
                                :
                                null
                        }    */}
                        <div className="amount">
                            { formatAmount(bridgeStep.toAmount, bridgeStep.toAsset) } { bridgeStep.toAsset.symbol }
                        </div>
                    </div>
                    <div className="fees">
                        {
                            bridgeFee ?
                                <div className="fee">
                                    { bridgeFee ? <>Fee: { bridgeFee } { bridgeStep?.protocolFees?.ассет?.symbol }</> : null }
                                </div>
                                :
                                null
                        }
                        {/* <div className="fee">
                            { bridgeFee ? <>Fee: { bridgeFee } { bridgeRoute.toAsset.symbol }</> : null }
                        </div> */}
                    </div>
                </div>
            </div>,
        value: routeId
    }))

    const sendTx = (id, chainId, to, data, value = '0x00') => {
        addRequest({
            id,
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
console.log({route});
            // let fromAsset, inputAmount = null
            // if (middlewareRoute) {
            //     fromAsset = middlewareRoute.fromAsset
            //     inputAmount = middlewareRoute.inputAmount
            // } else {
            //     fromAsset = bridgeRoute.fromAsset
            //     inputAmount = bridgeRoute.inputAmount
            // }

            // const { toAsset, outputAmount, bridgeInfo } = bridgeRoute
            
            const approvalTxn = await Promise.all(route.userTxs.filter(tx => tx?.approvalData).map(tx => {
                return approvalBuildTx(route.bridgeStep.fromChainId, selectedAccount, tx?.approvalData?.allowanceTarget, tx?.approvalData?.approvalTokenAddress, tx?.approvalData?.minimumApprovalAmount)
            }))

            approvalTxn.map(tx => sendTx(`transfer_approval_crosschain_${Date.now()}`, route.bridgeStep.fromChainId, tx.to, tx.data))
            
            const tx = await sendBuildTx(route, refuel)
            sendTx(`transfer_send_crosschain_${Date.now()}`, route.bridgeStep.fromChainId, tx.txTarget, tx.txData, tx.value)

            const serviceTimeMinutes = new Date((route?.serviceTime || 0) + (route?.serviceTime || 0)).getMinutes()
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
        } catch(e) {
            console.error(e);
            addToast(e.message || e, { error: true })
            setLoading(false)
        }
    }

    return (
        <div id="quotes">
            <div id="summary">
                <div className="path">
                    <div className="network">
                        <div className="icon" style={{backgroundImage: `url(${fromNetwork.icon})`}}></div>
                        <div className="name">{ fromNetwork.name }</div>
                    </div>
                    <div className="token">
                        <div className="icon" style={{backgroundImage: `url(${fromAsset.icon})`}}></div>
                        <div className="name">{ fromAsset.label }</div>
                    </div>
                </div>
                <MdOutlineArrowForward/>
                <div className="path">
                    <div className="network">
                        <div className="icon" style={{backgroundImage: `url(${toNetwork.icon})`}}></div>
                        <div className="name">{ toNetwork.name }</div>
                    </div>
                    <div className="token">
                        <div className="icon" style={{backgroundImage: `url(${toAsset.icon})`}}></div>
                        <div className="name">{ toAsset.name } ({ toAsset.symbol })</div>
                    </div>
                </div>
            </div>

            {
                loading ?
                    <Loading/>
                    :
                    <div id="routes">
                        <div className="title">Routes</div>
                        {
                            !radios.length ?
                                <div id="no-routes-placeholder">
                                    There is no routes available for this configuration at the moment.<br/>
                                    Try increasing the amount or switching token.
                                </div>
                                :
                                <Radios radios={radios} onChange={value => setSelectedRoute(value)}/>
                        }
                    </div>
            }

            <div className="separator"></div>

            <div id="buttons">
                <Button small clear icon={routes.length ? <MdOutlineClose/> : <MdOutlineArrowBack/>} disabled={loading} onClick={onCancel} className='buttonComponent'>{ routes.length ? 'Cancel' : 'Go Back' }</Button>
                { routes.length ? 
                    <Button small icon={<MdOutlineCheck/>} disabled={!selectedRoute || loading} onClick={onConfirm} className='buttonComponent'>Confirm</Button>
                : null }
            </div>
        </div>
    )
}

export default Quotes