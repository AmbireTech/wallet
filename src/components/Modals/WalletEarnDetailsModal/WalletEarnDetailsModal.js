import './WalletEarnDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import { ToolTip } from 'components/common' 
import { useWalletEarnDetails } from 'hooks'

const WalletEarnDetailsModal = ({ apy, accountId = null, title = 'Details', description = '' }) => {
    const { hideModal } = useModals()
    
    const { balance, poolShare, allTimeRewards, totalDeposit, totalWithdraws, pendingToUnlock, readyToWithdraw } = useWalletEarnDetails({accountId})
    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
            <div className="wrapper">
                <div>Annual Percentage Yield (APY)</div><div>{apy}%</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Balance</div>
                <div>
                    <ToolTip label="* Warning: Because you have sent/received staking share token (Loyalty Pool: WALLET-LOYALTY), the reward shown may be less than your actual reward.">
                        {balance} WALLET* (Pool share: {(poolShare * 100).toFixed(2)}%)
                    </ToolTip>
                </div>
            </div>
            <div className="wrapper">
                <div>All time rewards</div><div>{allTimeRewards} WALLET</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Total deposit</div><div>{totalDeposit} WALLET</div>
            </div>
            <div className="wrapper">
                <div>Total withdraws</div><div>{totalWithdraws} WALLET</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Pending to unlock</div><div>{pendingToUnlock} WALLET</div>
            </div>
            <div className="wrapper">
                <div>Ready to withdraw</div><div>{readyToWithdraw} WALLET</div>
            </div>
        </Modal>
    )
}

export default WalletEarnDetailsModal
