import './Quotes.scss'

import { MdOutlineArrowForward, MdOutlineCheck, MdOutlineClose } from 'react-icons/md';
import { Button, Radios } from '../../../../common';
import { useState } from 'react';

const formatAmount = (amount, asset) => amount / Math.pow(10, asset.decimals)

const Quotes = ({ fromTokensItems, quotes, onCancel }) => {
    const { toAsset } = quotes;
    const fromAsset = fromTokensItems.find(({ value }) => value === quotes.fromAsset.address)
    const [selectedRoute, setSelectedRoute] = useState(null)

    const routes = quotes.routes.map(({ routePath, fees, middlewareRoute, bridgeRoute }) => ({
        routePath,
        middlewareRoute,
        bridgeRoute,
        middlewareFee: formatAmount(fees.middlewareFee.amount, middlewareRoute.toAsset),
        bridgeFee: formatAmount(fees.bridgeFee.amount, bridgeRoute.toAsset)
    }))

    const radios = routes.map(({ routePath, middlewareFee, bridgeFee, middlewareRoute, bridgeRoute }) => ({
        label:
            <div className="route">
                <div className="info">
                    <div className="middleware">
                        <div className="icon" style={{backgroundImage: `url(${middlewareRoute.middlewareInfo.icon})`}}></div>
                        <div className="name">{ middlewareRoute.middlewareInfo.displayName }</div>
                    </div>
                    <div className="bridge">
                        <div className="icon" style={{backgroundImage: `url(${bridgeRoute.bridgeInfo.icon})`}}></div>
                        <div className="name">{ bridgeRoute.bridgeInfo.displayName }</div>
                    </div>
                </div>
                <div className="summary">
                    <div className="amounts">
                        <div className="amount">
                            { formatAmount(middlewareRoute.inputAmount, middlewareRoute.fromAsset) } { middlewareRoute.fromAsset.symbol }
                        </div>
                        <div className="amount">
                            { formatAmount(bridgeRoute.outputAmount, bridgeRoute.toAsset) } { bridgeRoute.toAsset.symbol }
                        </div>
                    </div>
                    <div className="fees">
                        <div className="fee">
                            { middlewareFee ? <>Fee: { middlewareFee } { middlewareRoute.fromAsset.symbol }</> : null }
                        </div>
                        <div className="fee">
                            { bridgeFee ? <>Fee: { bridgeFee } { bridgeRoute.toAsset.symbol }</> : null }
                        </div>
                    </div>
                </div>
            </div>,
        value: routePath
    }))

    const onConfirm = () => {
        const route = routes.find(({ routePath }) => routePath === selectedRoute)
        console.log(route)
    }

    return (
        <div id="quotes">
            <div id="summary">
                <div className="token">
                    <div className="icon" style={{backgroundImage: `url(${fromAsset.icon})`}}></div>
                    <div className="name">{ fromAsset.label }</div>
                </div>
                <MdOutlineArrowForward/>
                <div className="token">
                    <div className="icon" style={{backgroundImage: `url(${toAsset.icon})`}}></div>
                    <div className="name">{ toAsset.name } ({ toAsset.symbol })</div>
                </div>
            </div>

            <div id="routes">
                <div className="title">Routes</div>
                <Radios radios={radios} onChange={value => setSelectedRoute(value)}/>
            </div>

            <div className="separator"></div>

            <div id="buttons">
                <Button small clear icon={<MdOutlineClose/>} onClick={onCancel}>Cancel</Button>
                <Button small icon={<MdOutlineCheck/>} disabled={!selectedRoute} onClick={onConfirm}>Confirm</Button>
            </div>
        </div>
    )
}

export default Quotes