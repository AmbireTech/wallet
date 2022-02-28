import './MoreDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import { ToolTip } from 'components/common' 
import { useWalletEarnDetails } from 'hooks'

const MoreDetailsModal = ({ isWalletMoreDetails = true, apy, accountId }) => {
    const { hideModal } = useModals()
    const { balance, poolShare, allTimeRewards, totalDeposit, totalWithdraws, pendingToUnlock, readyToWithdraw } = useWalletEarnDetails({accountId})
   
    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)

    return (
        <Modal id="wallet-more-details-modal" title={'Details'} buttons={buttons}>
            {isWalletMoreDetails ? (
            <>
                <div className="wrapper odd-rows-bg">
                    {/* <div>Pool</div><div>{mockData.pool}</div> */}
                    <div>Pool</div><div>Ambire Staking</div>
                </div>
                <div className="wrapper">
                    <div>APY</div><div>{apy}%</div>
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
                    <div>Total Deposit</div><div>{totalDeposit} WALLET</div>
                </div>
                <div className="wrapper">
                    <div>Total Withdraws</div><div>{totalWithdraws} WALLET</div>
                </div>
                <div className="wrapper odd-rows-bg">
                    <div>Pending to unlock</div><div>{pendingToUnlock} WALLET</div>
                </div>
                <div className="wrapper">
                    <div>Ready to withdraw</div><div>{readyToWithdraw} WALLET</div>
                </div>
            </>) :
            (<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>)}
        </Modal>
    )
}

export default MoreDetailsModal
