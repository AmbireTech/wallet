import './WalletTokenModal.scss'

import { Button, Modal, ToolTip } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import useStakedWalletToken from 'ambire-common/src/hooks/useStakedWalletToken'
import MultiplierBadges from './MultiplierBadges'
import { useState } from 'react'
import UnbondModal from './UnbondModal/UnbondModal'
import { formatFloatTokenAmount } from 'lib/formatters'
import Lottie from 'lottie-react'
import AmbireLogoAnimation from 'resources/rewards/rewards-active.mp4.lottie.json'

const MIN_ELIGIBLE_USD = 1000
const MIN_CLAIMABLE_WALLET = 1000

const WalletTokenModal = ({ accountId, claimableWalletToken, rewards }) => {

  const [isUnbondModalVisible, setIsUnbondModalVisible] = useState(false)
  const { hideModal } = useModals()
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
    shouldDisplayMintableVesting,
  } = claimableWalletToken

  const { walletTokenAPYPercentage, adxTokenAPYPercentage, xWALLETAPYPercentage } = rewards

  const claimWithBurn = () => claimEarlyRewards(false)

  const modalButtons = <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>

  const eligibilityLeft = MIN_ELIGIBLE_USD - rewards.balance.balanceInUSD
  const isEligible = eligibilityLeft <= 0
  const walletClaimableLeft = MIN_CLAIMABLE_WALLET - claimableNow
  const canClaimWallet = walletClaimableLeft <= 0

  const apys = {
    adxStakingApy: {
      unlocked: rewards['adx-rewards'] > 0,
      apy: adxTokenAPYPercentage
    }
  }

  return (
    <Modal id='wallet-token-modal' title='WALLET token distribution' buttons={modalButtons}>
      <UnbondModal
        isVisible={isUnbondModalVisible}
        hideModal={hideUnbondModal}
        text='This procedure will claim only 50% of your outstanding
                rewards as $WALLET, and permanently burn the rest.
                Are you sure?'
        onClick={claimWithBurn}
      />

      <div className={'rewards-progress-container'}>
        <div className={'rewards-progress-path'}>
          <div className={`rewards-progress-holding active`}>
            <div className={`rewards-progress-holding-icon`}></div>
          </div>
          <div className={`rewards-progress-bar rewards-progress-holding active`}>
            <div className={`rewards-progress-bar-filler`}
                 style={{ width: (Math.min(rewards.balance.balanceInUSD / MIN_ELIGIBLE_USD, 1) * 100) + '%' }}></div>
            <span><b>${Math.floor(Math.min(rewards.balance.balanceInUSD, MIN_ELIGIBLE_USD))}</b>/${MIN_ELIGIBLE_USD}</span>
          </div>

          <div className={`rewards-wallet ${isEligible ? 'active' : 'inactive'}`}>
            {
              isEligible
                ? <Lottie className='rewards-wallet-icon-animated' animationData={AmbireLogoAnimation}
                          background='transparent' speed='1' loop autoplay/>
                : <div className={`rewards-wallet-icon`}></div>
            }
          </div>

          <div className={`rewards-progress-bar rewards-progress-wallets ${isEligible ? 'active' : 'inactive'}`}>
            <div className={`rewards-progress-bar-filler`}
                 style={{ width: (Math.min(claimableNow / MIN_CLAIMABLE_WALLET, 1) * 100) + '%' }}></div>
            <span><b>${Math.floor(Math.min(claimableNow, MIN_CLAIMABLE_WALLET))}</b>/${MIN_CLAIMABLE_WALLET}</span>
          </div>
          <div className={`rewards-progress-claim ${canClaimWallet ? 'active' : 'inactive'}`}>
            <div className={`rewards-progress-claim-icon`}></div>
          </div>
        </div>
        <div className={'rewards-progress-labels'}>
          <span>Balance</span>
          <span>My Ambire Rewards</span>
          <span>Unlock Claim</span>
        </div>
      </div>

      <MultiplierBadges rewards={rewards} apys={apys}/>

      <div id='info'>
        You are receiving $WALLETs for holding funds on your Ambire wallet as an early user. <a
        href='https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747' target='_blank' rel='noreferrer'>Read
        More</a>
      </div>

      <div className='item'>
        <div className='details'>
          <label>Claimable now (Early users + ADX Staking bonus)</label>
          <div className='balance'>
            <div className='amount'><span
              className='primary-accent'>{formatFloatTokenAmount(Math.floor(claimableNow), true, 0)}</span></div>
            <div className='amount usd'><span className='text'>$</span>{claimableNowUsd}</div>
          </div>
        </div>
        <div className='actions mt-4'>
          <Button className='claim-rewards-with-burn' purpleGradient full onClick={openUnbondModal}
                  disabled={!!(claimDisabledReason || disabledReason)}>Claim with burn</Button>
          <Button className='claim-rewards-x-wallet' greenGradient full onClick={claimEarlyRewards}
                  disabled={!!(claimDisabledReason || disabledReason)}>CLAIM IN xWALLET</Button>
        </div>
      </div>

      <div className='item'>
        <div className='details'>
          <label>Early users Incentive</label>
          <div className='balance'>
            <div className='amount'><span className='primary-accent'>{rewards['balance-rewards']}</span></div>
            <div className='amount apy'>{walletTokenAPYPercentage} <span>APY</span></div>
          </div>
        </div>
      </div>

      <div className='item'>
        <div className='details'>
          <label>ADX staking bonus</label>
          <div className={'activation-badge'}>
            <span className={`badge-adx ${rewards['adx-rewards'] > 0 ? 'active' : 'inactive'}`}></span>
          </div>
          <div className='balance'>
            <div className='amount'><span
              className='primary-accent'>{rewards['adx-rewards'] === 0 ? '0.00' : rewards['adx-rewards']}</span></div>
            <div className='amount apy'>{adxTokenAPYPercentage} <span>APY</span></div>
          </div>
        </div>
      </div>

      {shouldDisplayMintableVesting && (
        <div className='item'>
          <div className='details'>
            <label>Claimable early supporters vesting</label>
            <div className='balance'>
              <div className='amount'><span className='primary-accent'>
                                {currentClaimStatus.mintableVesting}
                            </span></div>
              <div className='amount usd'>
                <span className='secondary-accent'>$</span>
                {mintableVestingUsd}
              </div>
            </div>
          </div>
          <div className='actions mt-4'>
            <ToolTip label={
              disabledReason || `Linearly vested over approximately ${Math.ceil((vestingEntry.end - vestingEntry.start) / 86400)} days`
            }>
              <Button primaryGradient full onClick={claimVesting} disabled={!!disabledReason}>CLAIM</Button>
            </ToolTip>
          </div>
        </div>
      )}

      {!!stakedAmount && (
        <div className='item'>
          <div className='details'>
            <label>Staked WALLET</label>
            <div className='balance'>
              <div className='amount'><span className='primary-accent'>
                                    {stakedAmount}
                                </span></div>
              <div className='amount apy'>{xWALLETAPYPercentage} <span>APY</span></div>
            </div>
          </div>
        </div>
      )}

    </Modal>
  )
}

export default WalletTokenModal
