import { useEffect, useCallback } from "react"
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

import { useLocalStorage } from 'hooks'
import useDynamicModal from "hooks/useDynamicModals"
import { Button, ToolTip, Loading } from "components/common"
import { WalletTokenModal, CongratsRewardsModal } from "components/Modals"

import styles from './WalletTokenButton.module.scss'

const getDefaultCongratsModalShownState = (currentClaimStatus, pendingTokensTotal) => {
  return !(
    currentClaimStatus && 
    currentClaimStatus.claimed === 0 && 
    currentClaimStatus.mintableVesting === 0 &&
    pendingTokensTotal && pendingTokensTotal !== '...' && parseFloat(pendingTokensTotal)
  )
}

const WalletTokenButton = ({ rewardsData, accountId, network, hidePrivateValue, addRequest, relayerURL, useRelayerData }) => {
    const { isLoading: rewardsIsLoading, errMsg: rewardsErrMsg, lastUpdated: rewardsLastUpdated } = rewardsData
    const claimableWalletToken = useClaimableWalletToken({
        relayerURL,
        useRelayerData,
        accountId,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
        rewardsLastUpdated
      })

    const { currentClaimStatus, pendingTokensTotal, vestingEntry } = claimableWalletToken
    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId, network }, { rewards: rewardsData.rewards })
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
        const isMatchingRewardsDataAccWithCurrAcc = rewardsData?.rewards?.accountAddr?.toLowerCase() === accountId.toLowerCase() 
        if (isCurrentClaimStatusLoadingAndNoPrevData
            || isRewardsDataLoadingAndNoPrevData
            || !isMatchingRewardsDataAccWithCurrAcc) {
          return (<span><Loading/></span>)
        }
        
        if (!vestingEntry) {
          return `${hidePrivateValue(pendingTokensTotal)} $WALLET`
        }
        
        if ((currentClaimStatus.claimed === null)
          || (currentClaimStatus.mintableVesting === null)
          || (currentClaimStatus.claimedInitial === null)) {
          return <span><Loading/></span>
        }
    
        return `${hidePrivateValue(pendingTokensTotal)} $WALLET`
    }, [currentClaimStatus, hidePrivateValue, pendingTokensTotal, rewardsErrMsg, rewardsIsLoading, rewardsLastUpdated, vestingEntry, accountId, rewardsData.rewards.accountAddr])
   
    // The comma is important here, it's used to ignore the first value of the array.
    const [, setCongratsModalState] = useLocalStorage({
        key: 'congratsModalState',
        defaultValue: []
    })
    
    const handleCongratsRewardsModal = useDynamicModal(CongratsRewardsModal, { pendingTokensTotal })

    useEffect(() => {
      const shouldShowCongratsModal = getDefaultCongratsModalShownState(currentClaimStatus, pendingTokensTotal)

      setCongratsModalState((prev) => {
        const currentAcc = prev.find(accItem => accItem.account === accountId)
        
        if (!currentAcc) {
          return [...prev, { account: accountId, isCongratsModalShown: shouldShowCongratsModal }]
        }
        if (parseFloat(pendingTokensTotal) > 0 && currentAcc && !currentAcc.isCongratsModalShown) {
          handleCongratsRewardsModal()
          const updated = prev.map(item => {
            if (item.account === accountId) {
              return { 
                ...item, 
                isCongratsModalShown: true 
              }
            } else {
              return item
            }
          })
          return updated
        }

        return prev
      })
    }, [accountId, currentClaimStatus, handleCongratsRewardsModal, pendingTokensTotal, setCongratsModalState])
    
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
            >
                { renderRewardsButtonText() }  
            </Button>
    )
}

export default WalletTokenButton
