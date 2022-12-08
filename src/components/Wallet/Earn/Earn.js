import './Earn.scss'

import { Loading } from 'components/common'
import AAVECard from './Cards/AAVECard/AAVECard'
import AmbireTokensCard from './Cards/AmbireTokensCard/AmbireTokensCard'
import YearnTesseractCard from './Cards/YearnTesseractCard/YearnTesseractCard'

const Earn = ({ portfolio, selectedNetwork, rewardsData, selectedAcc, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isCurrNetworkBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                        <AmbireTokensCard
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            tokens={portfolio.tokens}
                            rewardsData={rewardsData}
                            addRequest={addRequest}
                        />
                        <AAVECard networkId={selectedNetwork.id} tokens={portfolio.tokens} account={selectedAcc} addRequest={addRequest}/>
                        {/* Removed Tesseract because it's no longer available */}
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