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

const WalletTokenModal = ({ rewards }) => {
    const { hideModal } = useModals()

    const badges = useMemo(() => multiplierBadges.map(badge => {
        const isUnlocked = rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(badge.id)
        return {
            ...badge,
            active: isUnlocked
        }
    }), [rewards])

    const claimButton = <>
        <ToolTip label="Claiming will be available after the official token launch">
            <Button small clear disabled>CLAIM</Button>
        </ToolTip>
    </>

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="wallet-token-modal" title="WALLET token distribution" buttons={modalButtons}>
            <div className="item">
                <div className="details">
                    <label>Early users Incentive</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ rewards['balance-rewards'] }</span></div>
                        {/* <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div> */}
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
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
                    <label>ADX Staking Bonus</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ rewards['adx-rewards'] }</span></div>
                        {/* <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div> */}
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div>
            {/* <div className="item">
                <div className="details">
                    <label>Gas Rebates</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">0</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div> */}
            <div className="badges">
                {
                    badges.map(({ id, name, icon, color, multiplier, link, active }) => (
                        <a href={link} target="_blank" rel="noreferrer" key={id}>
                            <ToolTip label={`${name} x${multiplier} Multiplier`}>
                                <div className={`badge ${active ? 'active' : ''}`} style={{ backgroundColor: color, borderColor: color }}>
                                    <div className="icon">{ icon }</div>
                                    <div className="multiplier">x { multiplier }</div>
                                </div>
                            </ToolTip>
                        </a>
                    ))
                }
            </div>
            <div id="info">
                You are receiving $WALLETS for holding funds on your Ambire wallet as an early user. Have in mind that $WALLET has not launched yet. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal