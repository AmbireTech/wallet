import './WalletEarnDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import { ToolTip } from 'components/common' 

const WalletEarnDetailsModal = ({ 
    apy, 
    title = 'Details',
    balance, 
    poolShare, 
    allTimeRewards, 
    totalDeposit, 
    totalWithdraws, 
    pendingToUnlock, 
    readyToWithdraw, 
    remainingTime }) => {
    const { hideModal } = useModals()

    
    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
            <div className="wrapper">
                <div>Annual Percentage Yield (APY)</div><div>{apy}%</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Balance</div>
                <div>
                    <ToolTip label="* Warning: Because you have sent/received staking share token, the reward shown may be less than your actual reward.">
                        {parseFloat(balance).toFixed(4)} WALLET* (Pool share: {(poolShare * 100).toFixed(2)}%)
                    </ToolTip>
                </div>
            </div>
            <div className="wrapper">
                <div>All time rewards</div><div>{parseFloat(allTimeRewards).toFixed(4)} WALLET</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Total deposit</div><div>{parseFloat(totalDeposit).toFixed(4)} WALLET</div>
            </div>
            <div className="wrapper">
                <div>Total withdraws</div><div>{parseFloat(totalWithdraws).toFixed(4)} WALLET</div>
            </div>
            <div className="wrapper odd-rows-bg">
                <div>Pending to unlock</div><div>{remainingTime ? `${remainingTime} until ${parseFloat(pendingToUnlock).toFixed(4)} WALLET becomes available for withdraw.` : '0.0 WALLET'}</div>
            </div>
            <div className="wrapper">
                <div>Ready to withdraw</div><div>{parseFloat(readyToWithdraw).toFixed(4)} WALLET</div>
            </div>
        </Modal>
    )
}

export default WalletEarnDetailsModal
