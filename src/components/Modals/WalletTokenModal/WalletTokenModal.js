import { useState } from 'react'
import cn from 'classnames'
import useStakedWalletToken from 'ambire-common/src/hooks/useStakedWalletToken'
import { rpcProviders } from 'config/providers'

import { formatFloatTokenAmount } from 'lib/formatters'

import { Button, Modal, ToolTip, Loading } from 'components/common'
import { useModals } from 'hooks'
import { ReactComponent as InfoIcon } from 'resources/icons/information.svg'
import UnbondModal from './UnbondModal/UnbondModal'

import styles from './WalletTokenModal.module.scss'

const WalletTokenModal = ({ accountId, claimableWalletToken, rewards, network }) => {
  const [isUnbondModalVisible, setIsUnbondModalVisible] = useState(false)
  const provider = rpcProviders['ethereum-ambire-earn']
  const { stakedAmount, isLoading } = useStakedWalletToken({ accountId, provider })
  const { hideModal } = useModals()

  const hideUnbondModal = () => setIsUnbondModalVisible(false)

  const openUnbondModal = () => setIsUnbondModalVisible(true)

  const {
    vestingEntry,
    currentClaimStatus,
    claimableNow,
    disabledReason,
    claimDisabledReason,
    claimEarlyRewards,
    claimVesting,
    claimableNowUsd,
    mintableVestingUsd,
    shouldDisplayMintableVesting
  } = claimableWalletToken

  const { walletTokenAPYPercentage, xWALLETAPYPercentage } = rewards

  const claimWithBurn = () => {
    claimEarlyRewards(false)
    hideUnbondModal()
    hideModal()
  }

  const claimEarly = () => {
    claimEarlyRewards(true)
    hideModal()
  }

  const claimWithVesting = () => {
    claimVesting()
    hideModal()
  }

  const formatAmount = (amount) => (amount ? amount.toFixed(6) : 0)

  return (
    <Modal
      className={styles.wrapper}
      contentClassName={styles.content}
      title="WALLET token distribution"
    >
      <UnbondModal
        isVisible={isUnbondModalVisible}
        hideModal={hideUnbondModal}
        text="This procedure will claim only 50% of your outstanding
                rewards as $WALLET, and permanently burn the rest.
                Are you sure?"
        onClick={claimWithBurn}
      />
      <div className={styles.rewardsDisabled}>
        <InfoIcon className={styles.rewardsDisabledIcon} />
        <p className={styles.rewardsDisabledText}>
          {' '}
          We are preparing for the public launch of our browser extension. Following a recent
          governance vote, early users $WALLET rewards are no longer available in the Web and Mobile
          versions of Ambire Wallet.
        </p>
        <a
          className={styles.rewardsDisabledLink}
          href="https://blog.ambire.com/stop-early-user-incentives/"
          target="_blank"
          rel="noreferrer"
        >
          Read More
        </a>
      </div>
      <div className={styles.item}>
        <div className={styles.details}>
          <label>Claimable now</label>
          <div className={styles.balance}>
            <div className={styles.amount}>
              <span>{formatFloatTokenAmount(Math.floor(claimableNow), true, 0)}</span>
            </div>
            <div className={cn(styles.amount, styles.usd)}>
              <span>$</span>
              {claimableNowUsd}
            </div>
          </div>
        </div>
        <div className={cn(styles.actions, 'mt-4')}>
          <ToolTip label={network.id !== 'ethereum' ? 'Switch to Ethereum network to claim' : ''}>
            <Button
              className={styles.fullWidthButton}
              variant="secondaryGradient"
              onClick={openUnbondModal}
              disabled={!!(claimDisabledReason || disabledReason)}
            >
              Claim with burn
            </Button>
            <Button
              className={styles.fullWidthButton}
              variant="terniaryGradient"
              onClick={claimEarly}
              disabled={!!(claimDisabledReason || disabledReason)}
            >
              CLAIM IN xWALLET
            </Button>
          </ToolTip>
        </div>
      </div>
      <div className={styles.item}>
        <div className={styles.details}>
          <label>Early users Incentive total (Early users + ADX Staking bonus)</label>
          <div className={styles.balance}>
            <div className={styles.amount}>
              <span>{formatAmount(rewards['balance-rewards'])}</span>
            </div>
            <div className={cn(styles.amount, styles.apy)}>
              {walletTokenAPYPercentage} <span>APY</span>
            </div>
          </div>
        </div>
      </div>
      {shouldDisplayMintableVesting && (
        <div className={styles.item}>
          <div className={styles.details}>
            <label>Claimable early supporters vesting</label>
            <div className={styles.balance}>
              <div className={styles.amount}>
                <span>{formatAmount(currentClaimStatus.mintableVesting)}</span>
              </div>
              <div className={cn(styles.amount, styles.usd)}>
                <span>$</span>
                {mintableVestingUsd}
              </div>
            </div>
          </div>
          <div className={cn(styles.actions, 'mt-4')}>
            <ToolTip
              label={
                disabledReason ||
                `Linearly vested over approximately ${Math.ceil(
                  (vestingEntry.end - vestingEntry.start) / 86400
                )} days`
              }
            >
              <Button
                variant="primaryGradient"
                className={styles.fullWidthButton}
                onClick={claimWithVesting}
                disabled={!!disabledReason}
              >
                Claim
              </Button>
            </ToolTip>
          </div>
        </div>
      )}
      <div className={styles.item}>
        <div className={styles.details}>
          <label>Staked WALLET</label>
          <div className={styles.balance}>
            {!isLoading && (
              <div className={styles.amount}>
                <span>{formatAmount(stakedAmount)}</span>
              </div>
            )}
            {isLoading && <Loading className={styles.loader} size={24} />}
            <div className={cn(styles.amount, styles.apy)}>
              {xWALLETAPYPercentage} <span>APY</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default WalletTokenModal
