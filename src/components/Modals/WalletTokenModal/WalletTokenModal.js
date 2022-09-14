import './WalletTokenModal.scss'

import { useMemo } from 'react'
import { Button, Modal, ToolTip } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { multiplierBadges } from 'ambire-common/src/constants/multiplierBadges'
import useStakedWalletToken from 'ambire-common/src/hooks/useStakedWalletToken'

const MultiplierBadges = ({ rewards }) => {
    // Multiplier badges
    const badges = useMemo(() => multiplierBadges.map(badge => {
        const isUnlocked = rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(badge.id)
        return {
            ...badge,
            active: isUnlocked
        }
    }), [rewards])

    return (<div className="badges">
        {
            badges.map(({ id, name, icon, color, multiplier, link, active }) => (
                <a href={link} target="_blank" rel="noreferrer" key={id}>
                    <ToolTip label={`You ${active ? 'are receiving' : 'do not have'} the ${name} x${multiplier} multiplier`}>
                        <div className={`badge ${active ? 'active' : ''}`} style={{ backgroundColor: color, borderColor: color }}>
                            <div className="icon">{ icon }</div>
                            <div className="multiplier">x { multiplier }</div>
                        </div>
                    </ToolTip>
                </a>
            ))
        }
    </div>)
}

const WalletTokenModal = ({ accountId, claimableWalletToken, rewards }) => {
    const { hideModal } = useModals()
    const { stakedAmount } = useStakedWalletToken({ accountId })

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

    const claimeWithBurnNotice = 'This procedure will claim 70% of your outstanding rewards as $WALLET, and permanently burn the other 30%'
    const claimWithBurn = () => {
        const confirmed = window.confirm(`${claimeWithBurnNotice}. Are you sure?`)
        if (confirmed) claimEarlyRewards(false)
    }

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>
    return (
        <Modal id="wallet-token-modal" title="WALLET token distribution" buttons={modalButtons}>
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
                        <Button className="claim-rewards-with-burn" small clear onClick={() => claimWithBurn()} disabled={!!(claimDisabledReason || disabledReason)}>Claim with burn</Button>
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

            <MultiplierBadges rewards={rewards}/>
            <div id="info">
                You are receiving $WALLETs for holding funds on your Ambire wallet as an early user. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal
