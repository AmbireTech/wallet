import './WalletTokenModal.scss'

import { Button, Modal, ToolTip } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import useStakedWalletToken from 'ambire-common/src/hooks/useStakedWalletToken'
import MultiplierBadges from './MultiplierBadges'
import { useState } from 'react'
import UnbondModal from './UnbondModal/UnbondModal'

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
    const { walletTokenAPYPercentage, adxTokenAPYPercentage, xWALLETAPYPercentage } = rewards;

    const claimeWithBurnNotice = 'This procedure will claim 50% of your outstanding rewards as $WALLET, and permanently burn the other 50%'
    
    const claimWithBurn = () => claimEarlyRewards(false)

    const modalButtons = <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>

    return (
        <Modal id="wallet-token-modal" title="WALLET token distribution" buttons={modalButtons}>
            <UnbondModal 
                isVisible={isUnbondModalVisible} 
                hideModal={hideUnbondModal} 
                text="This procedure will claim only 50% of your outstanding 
                rewards as $WALLET, and permanently burn the rest. 
                Are you sure?"
                onClick={claimWithBurn}
            />
            <div>
                <div className="item">
                    <div className="details">
                        <label>Early users Incentive: Total</label>
                        <div className="balance">
                            <div className="amount"><span className="primary-accent">{ rewards['balance-rewards'] }</span></div>
                            <div className="amount apy">{walletTokenAPYPercentage} <span>APY</span></div>
                        </div>
                    </div>
                    <div className="actions">
                        { /* claimButton */ }
                    </div>
                </div>
                {/* <div className="item">
                    <div className="details">
                        <label>Referral Incentive</label>
                        <div className="balance">
                            <div className="amount"><span className="primary-accent">0</span></div>
                            <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                        </div>
                    </div>
                    <div className="actions">
                        { claimButton }
                    </div>
                </div> */}
                <div className="item">
                    <div className="details">
                        <label>ADX Staking Bonus: Total</label>
                        <div className="balance">
                            <div className="amount"><span className="primary-accent">{ rewards['adx-rewards'] }</span></div>
                            <div className="amount apy">{adxTokenAPYPercentage} <span>APY</span></div>
                        </div>
                    </div>
                    <div className="actions">
                        { /* claimButton */ }
                    </div>
                </div>

                <div className="item">
                    <div className="details">
                        <label>Claimable now: early users + ADX Staking bonus</label>
                        <div className="balance">
                            <div className="amount"><span className="primary-accent">{
                                currentClaimStatus.loading ? '...' : claimableNow
                            }</span></div>
                            <div className="amount usd">
                                <span className="secondary-accent">$</span>
                                { claimableNowUsd }
                            </div>
                        </div>
                    </div>
                    <div className="actions">
                        <ToolTip label={
                                claimDisabledReason || disabledReason || claimeWithBurnNotice
                            }>
                            <Button className="claim-rewards-with-burn" small clear onClick={openUnbondModal} disabled={!!(claimDisabledReason || disabledReason)}>Claim with burn</Button>
                        </ToolTip>

                        <ToolTip label={
                                claimDisabledReason || disabledReason || 'Claim all of your outstanding rewards as staked $WALLET (xWALLET)'
                            }>
                            <Button className="claim-rewards-x-wallet" small clear onClick={claimEarlyRewards} disabled={!!(claimDisabledReason || disabledReason)}>CLAIM IN xWALLET</Button>
                        </ToolTip>
                    </div>
                </div>

                {shouldDisplayMintableVesting && (
                <div className="item">
                    <div className="details">
                        <label>Claimable early supporters vesting</label>
                        <div className="balance">
                            <div className="amount"><span className="primary-accent">
                                { currentClaimStatus.mintableVesting }
                            </span></div>
                            <div className="amount usd">
                                <span className="secondary-accent">$</span>
                                { mintableVestingUsd }
                            </div>
                        </div>
                    </div>
                    <div className="actions">
                        <ToolTip label={
                                disabledReason || `Linearly vested over approximately ${Math.ceil((vestingEntry.end - vestingEntry.start) / 86400)} days`
                            }>
                            <Button small clear onClick={claimVesting} disabled={!!disabledReason}>CLAIM</Button>
                        </ToolTip>
                    </div>
                </div>
                )}

                {!!stakedAmount && (
                    <div className="item">
                        <div className="details">
                            <label>Staked WALLET</label>
                            <div className="balance">
                                <div className="amount"><span className="primary-accent">
                                    { stakedAmount }
                                </span></div>
                                <div className="amount apy">{ xWALLETAPYPercentage } <span>APY</span></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <MultiplierBadges rewards={rewards}/>
            <div id="info">
                You are receiving $WALLETs for holding funds on your Ambire wallet as an early user. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal
