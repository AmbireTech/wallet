import './Earn.scss'
import AAVECard from './Cards/AAVECard'
import { Loading } from '../../common'

const Earn = ({ portfolio, selectedNetwork }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <AAVECard network={{...selectedNetwork}} tokens={portfolio.tokens}/>
            }
        </div>
    )
}

export default Earn