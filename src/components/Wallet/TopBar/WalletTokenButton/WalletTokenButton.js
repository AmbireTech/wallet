import useDynamicModal from "hooks/useDynamicModals"
import { Button, ToolTip, Loading } from "components/common"
import WalletTokenModal from "components/Modals/WalletTokenModal/WalletTokenModal"
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'
import { useCallback } from 'react'

import styles from './WalletTokenButton.module.scss'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest, relayerURL, useRelayerData }) => {
    const { isLoading: rewardsIsLoading, errMsg: rewardsErrMsg, lastUpdated: rewardsLastUpdated } = rewardsData
    const claimableWalletToken = useClaimableWalletToken({
        relayerURL,
        useRelayerData,
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
        rewardsLastUpdated
      })

    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })
    const renderRewardsButtonText = useCallback(() => {
        // The rewards value depends on both - the currentClaimStatus and the
        // rewards data. Therefore - require both data sets to be loaded.
        const hasErrorAndNoPrevValues =
          (currentClaimStatus.error || rewardsErrMsg) &&
          (!currentClaimStatus.lastUpdated || !rewardsLastUpdated)
        if (hasErrorAndNoPrevValues) {
          return 'Rewards'
        }
    
        // Display loading state only if prev data is missing for any of both data sets.
        // For all other cases - display the prev data instead of loading indicator,
        // so that the UI doesn't jump by switching loading indicator on and off.
        const isCurrentClaimStatusLoadingAndNoPrevData =
          currentClaimStatus.loading && !currentClaimStatus.lastUpdated
        const isRewardsDataLoadingAndNoPrevData = rewardsIsLoading && !rewardsLastUpdated
        if (isCurrentClaimStatusLoadingAndNoPrevData || isRewardsDataLoadingAndNoPrevData) {
          return (<span><Loading/></span>)
        }
    
        return `${hidePrivateValue(pendingTokensTotal)} $WALLETs`
    }, [currentClaimStatus.error, currentClaimStatus.lastUpdated, currentClaimStatus.loading, hidePrivateValue, pendingTokensTotal, rewardsErrMsg, rewardsIsLoading, rewardsLastUpdated])

    return (
        !relayerURL ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled>Rewards</Button>
            </ToolTip>
            :
            <Button
                small
                border
                onClick={showWalletTokenModal}
                className={styles.button}
                style={{ textTransform: 'none'}}
            >
                { renderRewardsButtonText() }  
            </Button>
    )
}

export default WalletTokenButton
