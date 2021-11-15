import './Earn.scss'
import AAVECard from './Cards/AAVECard'
import { Loading } from '../../common'

const Earn = ({ portfolio, selectedNetwork, selectedAcc, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <AAVECard network={{...selectedNetwork}} tokens={portfolio.tokens} account={selectedAcc} addRequest={addRequest}/>
            }
        </div>
    )
}

export default Earn