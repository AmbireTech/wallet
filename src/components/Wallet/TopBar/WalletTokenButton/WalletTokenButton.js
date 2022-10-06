import useDynamicModal from "hooks/useDynamicModals";
import { Button, ToolTip } from "components/common";
import WalletTokenModal from "components/Modals/WalletTokenModal/WalletTokenModal";
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest, relayerURL, useRelayerData }) => {
    const claimableWalletToken = useClaimableWalletToken({
        relayerURL,
        useRelayerData,
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
      })
    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const { isLoading: isRewardsDataLoading, errMsg } = rewardsData
    const isLoading = isRewardsDataLoading || currentClaimStatus.loading;

    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })

    return (
        !isLoading && (errMsg || currentClaimStatus.error) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal} style={{ textTransform: 'none'}}>{ isLoading ? '...' : hidePrivateValue(pendingTokensTotal) } WALLET Rewards</Button>
    )
}

export default WalletTokenButton
