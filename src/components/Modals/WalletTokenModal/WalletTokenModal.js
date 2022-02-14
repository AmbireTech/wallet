import './WalletTokenModal.scss'

import { useMemo } from 'react'
import { Button, Modal, ToolTip } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'

const multiplierBadges = [
    {
        id: 'beta-tester',
        name: 'Beta Testers',
        icon: '🧪',
        color: '#6000FF',
        multiplier: 1.25,
        link: 'https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747'
    },
    {
        id: 'lobsters',
        name: 'Lobsters',
        icon: '🦞',
        color: '#E82949',
        multiplier: 1.50,
        link: 'https://blog.ambire.com/ambire-wallet-to-partner-with-lobsterdao-10b57e6da0-53c59c88726b'
    }
]
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

const WalletTokenModal = ({ claimableWalletToken, rewards }) => {
    const { hideModal } = useModals()

    const {
        vestingEntry,
        currentClaimStatus,
        claimableNow,
        disabledReason,
        claimDisabledReason,
        claimEarlyRewards,
        claimVesting
    } = claimableWalletToken

    const walletTokenAPY = rewards.walletTokenAPY ? (rewards.walletTokenAPY * 100).toFixed(2) : '...'
    const adxTokenAPY = rewards.adxTokenAPY ? (rewards.adxTokenAPY * 100).toFixed(2) : '...'
    const walletTokenUSDPrice = rewards.walletUsdPrice || 0

    const claimableNowUsd = walletTokenUSDPrice && !currentClaimStatus.loading && claimableNow ? (walletTokenUSDPrice * claimableNow).toFixed(2) : '...'
    const mintableVestingUsd = walletTokenUSDPrice && !currentClaimStatus.loading && currentClaimStatus.mintableVesting ? (walletTokenUSDPrice * currentClaimStatus.mintableVesting).toFixed(2) : '...'

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
                        <div className="amount apy">{ walletTokenAPY } % <span>APY</span></div>
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
                        <div className="amount apy">{ adxTokenAPY } % <span>APY</span></div>
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
                            claimDisabledReason || disabledReason || 'Claim all of your outstanding rewards as staked $WALLET (xWALLET)'
                        }>
                        <Button small clear onClick={claimEarlyRewards} disabled={!!(claimDisabledReason || disabledReason)}>Claim in xWALLET</Button>
                    </ToolTip>

                    <ToolTip label={
                            claimDisabledReason || disabledReason || 'Claim 70% of your outstanding rewards as $WALLET, and permanently burn the other 30%'
                        }>
                        <Button small clear onClick={claimEarlyRewards} disabled={!!(claimDisabledReason || disabledReason)}>Claim with burn</Button>
                    </ToolTip>
                </div>
            </div>

            {!!currentClaimStatus.mintableVesting && !!vestingEntry && (
            <div className="item">
                <div className="details">
                    <label>Claimable early supporters vesting</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{
                            currentClaimStatus.mintableVesting
                        }</span></div>
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

            <MultiplierBadges rewards={rewards}/>
            <div id="info">
                You are receiving $WALLETS for holding funds on your Ambire wallet as an early user. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal
