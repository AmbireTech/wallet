import useDynamicModal from "hooks/useDynamicModals"
import { Button, ToolTip, Loading } from "components/common"
import WalletTokenModal from "components/Modals/WalletTokenModal/WalletTokenModal"
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

import styles from './WalletTokenButton.module.scss'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest, relayerURL, useRelayerData }) => {
    const claimableWalletToken = useClaimableWalletToken({
        relayerURL,
        useRelayerData,
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
        rewardsLastUpdated: rewardsData.lastUpdated
      })

    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const { isLoading: isRewardsDataLoading, errMsg } = rewardsData
    const isLoading = isRewardsDataLoading || currentClaimStatus.loading
    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })
    const renderRewardsButtonText = () => {
        if (currentClaimStatus.loading && !currentClaimStatus.lastUpdated) {
          return (<span><Loading/></span>)
        }
    
        if (isRewardsDataLoading && !rewardsData.lastUpdated) {
          return (<span><Loading/></span>)
        }
    
        return `${hidePrivateValue(pendingTokensTotal)} $ WALLETS`
    }

    return (
        !isLoading && (errMsg || currentClaimStatus.error) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button
                small
                border
                disabled={isLoading}
                onClick={showWalletTokenModal}
                className={styles.button}
                style={{ textTransform: 'none'}}
            >
                { renderRewardsButtonText() }
                
            </Button>
    )
}

export default WalletTokenButton
