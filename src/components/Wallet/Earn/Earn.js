import './Earn.scss'
import AAVECard from './Cards/AAVECard/AAVECard'
import YearnTesseractCard from './Cards/YearnTesseractCard/YearnTesseractCard'
import { Loading } from 'components/common'
import AmbireTokensCard from './Cards/AmbireTokensCard/AmbireTokensCard'
import OfflineWrapper from 'components/OfflineWrapper/OfflineWrapper'

const Earn = ({ portfolio, selectedNetwork, rewardsData, selectedAcc, addRequest }) => {
    return (
        <OfflineWrapper>
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
        </OfflineWrapper>
    )
}

export default Earn