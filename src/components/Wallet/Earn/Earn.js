import './Earn.scss'
import AAVECard from './Cards/AAVECard/AAVECard'
import { Loading } from '../../common'

const Earn = ({ portfolio, selectedNetwork, selectedAcc, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <AAVECard networkId={selectedNetwork.id} tokens={portfolio.tokens} protocols={portfolio.protocols} account={selectedAcc} addRequest={addRequest}/>
            }
        </div>
    )
}

export default Earn