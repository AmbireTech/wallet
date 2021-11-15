import './Earn.scss'
import AAVECard from './Cards/AAVECard'
import { Loading } from '../../common'

const Earn = ({ portfolio, selectedNetwork }) => {
    const tokenItems = portfolio.tokens.map(({ img, symbol, address, balance }) => ({
        icon: img,
        label: symbol,
        value: address,
        balance: balance.toFixed(2)
    }))

    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <AAVECard network={{...selectedNetwork}} tokens={tokenItems}/>
            }
        </div>
    )
}

export default Earn