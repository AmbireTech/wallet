import { useEffect, useCallback } from 'react'
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

import { useLocalStorage } from 'hooks'
import useDynamicModal from 'hooks/useDynamicModals'
import { Button, ToolTip, Loading } from 'components/common'
import { WalletTokenModal, CongratsRewardsModal } from 'components/Modals'
import { useOfflineStatus } from 'context/OfflineContext/OfflineContext'

import styles from './WalletTokenButton.module.scss'

const checkShouldShowCongratsModal = (currentClaimStatus, pendingTokensTotal, rewardsData) => {
  if (typeof rewardsData !== 'object') return
  if (!('rewards' in rewardsData)) return

  const hasEnoughUSD = rewardsData.rewards.balance.balanceInUSD > 1000
  const hasEnoughWALLET =
    rewardsData.rewards['balance-rewards'] + rewardsData.rewards['adx-rewards'] > 1000

  // It should be shown, if the user has pending tokens, but hasn't claimed any of them yet
  return (
    pendingTokensTotal &&
    pendingTokensTotal !== '...' &&
    parseFloat(pendingTokensTotal) &&
    currentClaimStatus?.claimed === 0 &&
    currentClaimStatus?.claimedInitial === 0 &&
    hasEnoughUSD &&
    hasEnoughWALLET
  )
}

const WalletTokenButton = ({
  rewardsData,
  accountId,
  network,
  hidePrivateValue,
  addRequest,
  relayerURL,
  useRelayerData
}) => {
  const isOffline = useOfflineStatus()
  const {
    isLoading: rewardsIsLoading,
    errMsg: rewardsErrMsg,
    lastUpdated: rewardsLastUpdated
  } = rewardsData
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
  const showWalletTokenModal = useDynamicModal(
    WalletTokenModal,
    { claimableWalletToken, accountId, network },
    { rewards: rewardsData.rewards }
  )
  // Loading related variables:
  // Display loading state only if prev data is missing for any of both data sets.
  // For all other cases - display the prev data instead of loading indicator,
  // so that the UI doesn't jump by switching loading indicator on and off.
  const isCurrentClaimStatusLoadingAndNoPrevData =
    currentClaimStatus.loading && !currentClaimStatus.lastUpdated
  const isRewardsDataLoadingAndNoPrevData = rewardsIsLoading && !rewardsLastUpdated
  const isMatchingRewardsDataAccWithCurrAcc =
    rewardsData?.rewards?.accountAddr?.toLowerCase() === accountId.toLowerCase()
  const isCurrentClaimStatusDataLoading =
    isCurrentClaimStatusLoadingAndNoPrevData ||
    isRewardsDataLoadingAndNoPrevData ||
    !isMatchingRewardsDataAccWithCurrAcc

  const renderRewardsButtonText = useCallback(() => {
    // The rewards value depends on both - the currentClaimStatus and the
    // rewards data. Therefore - require both data sets to be loaded.
    const hasErrorAndNoPrevValues =
      (currentClaimStatus.error || rewardsErrMsg) &&
      (!currentClaimStatus.lastUpdated || !rewardsLastUpdated)
    if (hasErrorAndNoPrevValues) {
      return 'Rewards'
    }

    if (isCurrentClaimStatusDataLoading) {
      return (
        <span>
          <Loading />
        </span>
      )
    }

    if (!vestingEntry) {
      return `${hidePrivateValue(pendingTokensTotal)} $WALLET`
    }

    if (
      currentClaimStatus.claimed === null ||
      currentClaimStatus.mintableVesting === null ||
      currentClaimStatus.claimedInitial === null
    ) {
      return (
        <span>
          <Loading />
        </span>
      )
    }

    return `${hidePrivateValue(pendingTokensTotal)} $WALLET`
  }, [
    currentClaimStatus.claimed,
    currentClaimStatus.claimedInitial,
    currentClaimStatus.error,
    currentClaimStatus.lastUpdated,
    currentClaimStatus.mintableVesting,
    hidePrivateValue,
    isCurrentClaimStatusDataLoading,
    pendingTokensTotal,
    rewardsErrMsg,
    rewardsLastUpdated,
    vestingEntry
  ])

  // The comma is important here, it's used to ignore the first value of the array.
  // Here we store the accountIds of the users who have already seen the congrats modal.
  const [, setCongratsModalShownTo] = useLocalStorage({
    key: 'congratsModalShownTo',
    defaultValue: []
  })

  const showCongratsRewardsModal = useDynamicModal(CongratsRewardsModal, { pendingTokensTotal })

  useEffect(() => {
    if (isCurrentClaimStatusDataLoading) return

    const shouldShowCongratsModal = checkShouldShowCongratsModal(
      currentClaimStatus,
      pendingTokensTotal,
      rewardsData
    )

    if (!shouldShowCongratsModal) return

    setCongratsModalShownTo((prev) => {
      // We want to show the congrats modal only once per account.
      if (!prev.includes(accountId)) {
        showCongratsRewardsModal()
        return prev.concat(accountId)
      }

      return prev
    })
  }, [
    accountId,
    currentClaimStatus,
    showCongratsRewardsModal,
    pendingTokensTotal,
    setCongratsModalShownTo,
    isCurrentClaimStatusDataLoading,
    rewardsData
  ])

  return !relayerURL ? (
    <ToolTip label="WALLET rewards are not available without a connection to the relayer">
      <Button size="sm" disabled>
        Rewards
      </Button>
    </ToolTip>
  ) : (
    <Button
      size="sm"
      onClick={showWalletTokenModal}
      className={styles.button}
      disabled={
        (currentClaimStatus.loading && !currentClaimStatus.lastUpdated) ||
        (rewardsIsLoading && !rewardsLastUpdated) ||
        !(rewardsData?.rewards?.accountAddr?.toLowerCase() === accountId.toLowerCase()) ||
        isOffline
      }
    >
      {!isOffline ?renderRewardsButtonText(): 'You are offline'}
    </Button>
  )
}

export default WalletTokenButton
