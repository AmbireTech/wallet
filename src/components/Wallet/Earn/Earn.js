import './Earn.scss'
import AAVECard from './Cards/AAVECard/AAVECard'
import YearnCard from './Cards/YearnCard/YearnCard'
import { Loading } from 'components/common'

const Earn = ({ portfolio, selectedNetwork, selectedAcc, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                        <AAVECard networkId={selectedNetwork.id} tokens={portfolio.tokens} protocols={portfolio.protocols} account={selectedAcc} addRequest={addRequest}/>
                        <YearnCard
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            tokens={portfolio.tokens}
                            addRequest={addRequest}
                        />
                    </div>
            }
        </div>
    )
}

export default Earn