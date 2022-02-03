import './Earn.scss'
import AAVECard from './Cards/AAVECard/AAVECard'
import YearnTesseractCard from './Cards/YearnTesseractCard/YearnTesseractCard'
import { Loading } from 'components/common'
import WalletTokenCard from './Cards/WalletTokenCard/WalletTokenCard'

const Earn = ({ portfolio, selectedNetwork, selectedAcc, walletTokenInfoData, addRequest }) => {
    return (
        <div id="earn">
            {
                portfolio.isBalanceLoading ?
                    <Loading/>
                    :
                    <div className="cards">
                        <AAVECard networkId={selectedNetwork.id} tokens={portfolio.tokens} protocols={portfolio.protocols} account={selectedAcc} addRequest={addRequest}/>
                        <YearnTesseractCard
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            tokens={portfolio.tokens}
                            addRequest={addRequest}
                        />
                        <WalletTokenCard
                            networkId={selectedNetwork.id}
                            accountId={selectedAcc}
                            tokens={portfolio.tokens}
                            walletTokenInfoData={walletTokenInfoData}
                            addRequest={addRequest}
                        />
                    </div>
            }
        </div>
    )
}

export default Earn