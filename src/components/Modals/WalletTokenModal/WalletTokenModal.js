import './WalletTokenModal.scss'

import { Button, Modal, ToolTip } from '../../common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from '../../../hooks'

const WalletTokenModal = ({ rewards }) => {
    const { hideModal } = useModals()

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
            { rewards.multipliers && (<div className='multipliers'>
                {rewards.multipliers.map(({ mul, name }) => (
                    <Button small border disabled key={name}>{mul}x {name} multiplier</Button>
                ))}
            </div>)}
            <div id="info">
                You are receiving $WALLETS for holding funds on your Ambire wallet as an early user. Have in mind that $WALLET has not launched yet. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal