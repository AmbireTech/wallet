import useDynamicModal from "hooks/useDynamicModals";
import { Button, ToolTip } from "components/common";
import WalletTokenModal from "components/Modals/WalletTokenModal/WalletTokenModal";
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

const WalletTokenButton = ({ useFetchConstants, rewardsData, account = {}, network, hidePrivateValue, addRequest }) => {
    const claimableWalletToken = useClaimableWalletToken({
        useFetchConstants,
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
      })
    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const { isLoading, errMsg } = rewardsData

    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })

    return (
        !isLoading && (errMsg || currentClaimStatus.error) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal}>{ isLoading ? '...' : hidePrivateValue(pendingTokensTotal) } WALLET</Button>
    )
}

export default WalletTokenButton
