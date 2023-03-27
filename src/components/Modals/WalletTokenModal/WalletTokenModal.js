import { Button, Modal, ToolTip, RemoteLottie } from 'components/common'
import useStakedWalletToken from 'ambire-common/src/hooks/useStakedWalletToken'
import { useState } from 'react'
import { formatFloatTokenAmount } from 'lib/formatters'
import cn from 'classnames'
import UnbondModal from './UnbondModal/UnbondModal'
import MultiplierBadges from './MultiplierBadges/MultiplierBadges'
import styles from './WalletTokenModal.module.scss'

const MIN_ELIGIBLE_USD = 1000
const MIN_CLAIMABLE_WALLET = 1000
const MIN_CLAIMABLE_ADX_USD = 1000

const WalletTokenModal = ({ accountId, claimableWalletToken, rewards, network }) => {
  const [isUnbondModalVisible, setIsUnbondModalVisible] = useState(false)
  const { stakedAmount } = useStakedWalletToken({ accountId })

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

  const { walletTokenAPYPercentage, adxTokenAPYPercentage, xWALLETAPYPercentage } = rewards

  const claimWithBurn = () => claimEarlyRewards(false)

  const eligibilityLeft = MIN_ELIGIBLE_USD - rewards.balance.balanceInUSD
  const isEligible = eligibilityLeft <= 0
  const accumulatedWallets = rewards['balance-rewards'] + rewards['adx-rewards']
  const canClaimWallet = accumulatedWallets >= MIN_CLAIMABLE_WALLET

  const apys = {
    adxStakingApy: {
      unlocked: rewards['adx-rewards'] > 0,
      apy: adxTokenAPYPercentage
    }
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

      <div>
        <div className={styles.rewardsProgressPath}>
          <div>
            <div className={styles.rewardsProgressHoldingIcon} />
          </div>
          <div className={styles.rewardsProgressBar}>
            <div
              className={cn(styles.rewardsProgressBarFiller, styles.rewardsProgressBarFillerActive)}
              style={{
                width: `${Math.min(rewards.balance.balanceInUSD / MIN_ELIGIBLE_USD, 1) * 100}%`
              }}
            />
            <span>
              <b>
                ${Math.floor(Math.min(rewards.balance.balanceInUSD, MIN_ELIGIBLE_USD))}
                {rewards.balance.balanceInUSD > MIN_ELIGIBLE_USD && '+'}
              </b>
              /${MIN_ELIGIBLE_USD}
            </span>
          </div>

          <div>
            {isEligible ? (
              <ToolTip label="You are earning $WALLET rewards">
                <RemoteLottie
                  remoteJson="/resources/rewards/rewards-active.mp4.lottie.json"
                  className={styles.rewardsWalletIconAnimated}
                  background="transparent"
                  speed="1"
                  loop
                  autoplay
                />
              </ToolTip>
            ) : (
              <ToolTip
                label={`You need a balance worth more than $${MIN_ELIGIBLE_USD} worth of tokens to start accumulating $WALLET rewards`}
              >
                <div className={styles.rewardsWalletIcon} />
              </ToolTip>
            )}
          </div>

          <div className={styles.rewardsProgressBar}>
            <div
              className={cn(styles.rewardsProgressBarFiller, {
                [styles.rewardsProgressBarFillerActive]: isEligible
              })}
              style={{ width: `${Math.min(accumulatedWallets / MIN_CLAIMABLE_WALLET, 1) * 100}%` }}
            />
            <span>
              <b>
                $WALLET {Math.floor(Math.min(accumulatedWallets, MIN_CLAIMABLE_WALLET))}
                {accumulatedWallets > MIN_CLAIMABLE_WALLET && '+'}
              </b>
              /{MIN_CLAIMABLE_WALLET}
            </span>
          </div>
          <ToolTip
            label={
              canClaimWallet
                ? 'You can claim accumulated $WALLET rewards'
                : `You need to accumulate ${MIN_CLAIMABLE_WALLET} $WALLET to claim`
            }
          >
            <div>
              <div
                className={cn(styles.rewardsProgressClaimIcon, {
                  [styles.rewardsProgressClaimIconActive]: canClaimWallet
                })}
              />
            </div>
          </ToolTip>
        </div>
        <div className={styles.rewardsProgressLabels}>
          <span>Balance</span>
          <span>My Ambire Rewards</span>
          <span>Unlock Claim</span>
        </div>
      </div>

      <MultiplierBadges rewards={rewards} apys={apys} />

      <div className={styles.info}>
        You are receiving $WALLETs for holding funds on your Ambire wallet as an early user.{' '}
        <a
          href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747"
          target="_blank"
          rel="noreferrer"
        >
          Read More
        </a>
      </div>

      <div className={styles.item}>
        <div className={styles.details}>
          <label>Claimable now (Early users + ADX Staking bonus)</label>
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
              className={styles.claimRewardsWithBurn}
              secondaryGradient
              full
              onClick={openUnbondModal}
              disabled={!!(claimDisabledReason || disabledReason)}
            >
              Claim with burn
            </Button>
            <Button
              className={styles.claimRewardsXWallet}
              terniaryGradient
              full
              onClick={claimEarlyRewards}
              disabled={!!(claimDisabledReason || disabledReason)}
            >
              CLAIM IN xWALLET
            </Button>
          </ToolTip>
        </div>
      </div>

      <div className={styles.item}>
        <div className={styles.details}>
          <label>Early users Incentive (Total)</label>
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

      <div className={styles.item}>
        <div className={styles.details}>
          <label>
            <ToolTip
              label={
                rewards.balance.balanceFromADX >= MIN_CLAIMABLE_ADX_USD
                  ? '$ADX Staking bonus is active'
                  : `You need to stake $${MIN_CLAIMABLE_ADX_USD} in $ADX to receive the $ADX staking bonus`
              }
            >
              <div className={styles.activationBadge}>
                ADX staking bonus (Total){' '}
                <span
                  className={cn(styles.badgeAdx, {
                    [styles.badgeAdxActive]: rewards.balance.balanceFromADX >= MIN_CLAIMABLE_ADX_USD
                  })}
                />
              </div>
            </ToolTip>
          </label>
          <div className={styles.balance}>
            <div className={styles.amount}>
              <span>{formatAmount(rewards['adx-rewards'])}</span>
            </div>
            <div className={cn(styles.amount, styles.apy)}>
              {adxTokenAPYPercentage} <span>APY</span>
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
              <Button primaryGradient full onClick={claimVesting} disabled={!!disabledReason}>
                Claim
              </Button>
            </ToolTip>
          </div>
        </div>
      )}

      {!!stakedAmount && (
        <div className={styles.item}>
          <div className={styles.details}>
            <label>Staked WALLET</label>
            <div className={styles.balance}>
              <div className={styles.amount}>
                <span>{formatAmount(stakedAmount)}</span>
              </div>
              <div className={cn(styles.amount, styles.apy)}>
                {xWALLETAPYPercentage} <span>APY</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default WalletTokenModal
