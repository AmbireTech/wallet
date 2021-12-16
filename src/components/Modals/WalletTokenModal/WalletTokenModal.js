import './WalletTokenModal.scss'

import { Button, Modal, ToolTip } from '../../common'

const WalletTokenModal = ({ rewards }) => {
    const { balanceRewards, adxRewards } = rewards

    const claimButton = <>
        <ToolTip label="Claiming will be available after the official token launch">
            <Button small clear disabled>CLAIM</Button>
        </ToolTip>
    </>

    return (
        <Modal id="wallet-token-modal" title="$WALLET token distribution">
            <div className="item">
                <div className="details">
                    <label>Early users Incentive</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ balanceRewards }</span></div>
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
                        <div className="amount"><span className="primary-accent">{ adxRewards }</span></div>
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
        </Modal>
    )
}

export default WalletTokenModal