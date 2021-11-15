import './Earn.scss'

import AAVE_ICON from '../../../resources/aave.svg'
import YEARN_ICON from '../../../resources/yearn.svg'
import Card from './Card/Card'

const Earn = ({ portfolio }) => {
    const tokenItems = portfolio.tokens.map(({ img, symbol, address, balance }) => ({
        icon: img,
        label: symbol,
        value: address,
        balance: balance.toFixed(2)
    }))
    
    const cards = [
        {
            icon: AAVE_ICON,
            details: [
                ['Annual Percentage Yield (APY)', '20%'],
                ['Lock', 'No Lock'],
                ['TYPE', 'Variable Rate'],
            ]
        },
        {
            icon: YEARN_ICON,
            details: [
                ['Annual Percentage Yield (APY)', '20%'],
                ['Lock', 'No Lock'],
                ['Type', 'Variable Rate'],
            ]
        }
    ]

    return (
        <div id="earn">
            { cards.map(({ icon, title, details }) => (<Card icon={icon} title={title} details={details} tokens={tokenItems}/>)) }
        </div>
    )
}

export default Earn