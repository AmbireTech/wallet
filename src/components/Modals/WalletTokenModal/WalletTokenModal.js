import './WalletTokenModal.scss'

import { Button, Modal, ToolTip } from '../../common'

const WalletTokenModal = ({ rewards }) => {
    const { balanceRewards } = rewards

    const claimButton = <>
        <ToolTip label="Claiming will be available after the official token launch">
            <Button small disabled>CLAIM</Button>
        </ToolTip>
    </>

    return (
        <Modal id="wallet-token-modal" title="$WALLET token distribution">
            <div className="item">
                <div className="details">
                    <label>Balance in your account</label>
                    <div className="balance">
                        <div className="amount">{ balanceRewards.toFixed(6) } <span className="primary-accent">WALLET</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
            </div>
            <div className="title">Claimable</div>
            <div className="item">
                <div className="details">
                    <label>Early users Incentive</label>
                    <div className="balance">
                        <div className="amount">0 <span className="primary-accent">WALLET</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div>
            <div className="item">
                <div className="details">
                    <label>Referral Incentive</label>
                    <div className="balance">
                        <div className="amount">0 <span className="primary-accent">WALLET</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div>
            <div className="item">
                <div className="details">
                    <label>ADX Staking Bonus</label>
                    <div className="balance">
                        <div className="amount">0 <span className="primary-accent">WALLET</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div>
            <div className="item">
                <div className="details">
                    <label>Gas Rebates</label>
                    <div className="balance">
                        <div className="amount">0 <span className="primary-accent">WALLET</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div>
        </Modal>
    )
}

export default WalletTokenModal