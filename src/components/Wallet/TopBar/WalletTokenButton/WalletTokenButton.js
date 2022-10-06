import useDynamicModal from "hooks/useDynamicModals";
import { Button, ToolTip } from "components/common";
import { WalletTokenModal } from "components/Modals";
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

import styles from './WalletTokenButton.module.scss'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest }) => {
    const claimableWalletToken = useClaimableWalletToken({
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
      })
    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const buttonMessage = String(hidePrivateValue(pendingTokensTotal)).concat(' WALLET REWARDS')
    const { isLoading: isRewardsDataLoading, errMsg } = rewardsData
    const isLoading = isRewardsDataLoading || currentClaimStatus.loading;

    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })

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
                {
                    isLoading ? 
                    '... WALLET Rewards' : (
                        buttonMessage.length <= 22 ?
                        buttonMessage :
                        `${buttonMessage.substring(0, 19)}...` 
                    )
                    
                }
            </Button>
    )
}

export default WalletTokenButton
