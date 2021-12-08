import './WalletTokenModal.scss'

import { Button, Modal } from '../../common'

const WalletTokenModal = () => {
    return (
        <Modal id="wallet-token-modal" title="$WALLET token distribution">
            <div className="item">
                <div className="details">
                    <label>Balance in your account</label>
                    <div className="balance">
                        <div className="amount">0 <span className="primary-accent">WALLET</span></div>
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
                    <Button small>CLAIM</Button>
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
                    <Button small>CLAIM</Button>
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
                    <Button small>CLAIM</Button>
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
                    <Button small>CLAIM</Button>
                </div>
            </div>
        </Modal>
    )
}

export default WalletTokenModal