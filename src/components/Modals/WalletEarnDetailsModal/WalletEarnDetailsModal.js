import './WalletEarnDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
// import { ToolTip } from 'components/common' 
import { useWalletEarnDetails } from 'hooks'
import { Loading } from 'components/common'

const WalletEarnDetailsModal = ({ title = 'Details', apy, accountId, msToDaysHours }) => {
    const { hideModal } = useModals()
    
    const { 
        details,
        isLoading
        } = useWalletEarnDetails({accountId})

    const { balance, 
        poolShare, 
        allTimeRewards, 
        totalDeposit, 
        totalWithdraws, 
        pendingToUnlock, 
        readyToWithdraw, 
        remainingTime } = details
    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
           {isLoading ? (
           <>
                <div className="wrapper">
                    <div>Annual Percentage Yield (APY)</div><div>{apy}%</div>
                </div>
                <div className="wrapper odd-rows-bg">
                    <div>Balance</div>
                    <div>
                        {/* The tool tip will be activated after improvements of handling transactions */}
                        {/* <ToolTip label="* Warning: Because you have sent/received staking share token (xWallet pool), the reward shown may be less than your actual reward."> */}
                            {parseFloat(balance).toFixed(4)} WALLET (Pool share: {(poolShare * 100).toFixed(2)}%)
                        {/* </ToolTip> */}
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
                    <div>Total pending to unlock</div>
                    <div>
                        {remainingTime > 0 
                            ? `${msToDaysHours(remainingTime)} until ${parseFloat(pendingToUnlock).toFixed(4)} WALLET becomes available for withdraw.` 
                            : 'No pending unlocks'}
                    </div>
                </div>
                <div className="wrapper">
                    <div>Ready to withdraw</div>
                    <div>
                        {parseFloat(readyToWithdraw) > 0 
                        ? `${parseFloat(readyToWithdraw).toFixed(4)} WALLET`
                        : 'No amount for withdrawing'}
                    </div>
                </div>
            </>): <div className='loading-wrapper'><Loading/></div>}
        </Modal>
    )
}

export default WalletEarnDetailsModal
