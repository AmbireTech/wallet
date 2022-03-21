import './Earn.scss'
import AAVECard from './Cards/AAVECard/AAVECard'
import YearnTesseractCard from './Cards/YearnTesseractCard/YearnTesseractCard'
import { Loading } from 'components/common'
import AbmireTokensCard from './Cards/AbmireTokensCard/AbmireTokensCard'

const Earn = ({ portfolio, selectedNetwork, rewardsData, selectedAcc, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                        <AbmireTokensCard
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            tokens={portfolio.tokens}
                            rewardsData={rewardsData}
                            addRequest={addRequest}
                        />
                        <AAVECard networkId={selectedNetwork.id} tokens={portfolio.tokens} protocols={portfolio.protocols} account={selectedAcc} addRequest={addRequest}/>
                        <YearnTesseractCard
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