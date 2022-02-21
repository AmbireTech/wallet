import './MoreDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import { ToolTip } from 'components/common' 

const MoreDetailsModal = ({ title = 'Details', onClose, isWalletMoreDetails = true }) => {
    const { hideModal } = useModals()
    //TODO: remove mock data
    const mockData = {
        pool: 'Loyalty pool',
        apy: '300.0%',
        balance: '56,274.5032 WALLET* (Pool share: 0.23452%)',
        allTimeRewards: '56,274.5032 WALLET*',
        totalDeposit: '56,274.5032 WALLET*',
        totalWithdraws: '0.00 WALLET*',
        pendingToUnlock: 'N/A',
        readyToWithdraw: 'N/A',
    }

    const buttons = (<Button clear small icon={<MdClose />} onClick={hideModal}>Close</Button>)

    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
            {isWalletMoreDetails ? (
            <>
                <div className="wrapper odd-rows-bg">
                    <div>Pool</div><div>{mockData.pool}</div>
                </div>
                <div className="wrapper">
                    <div>APY</div><div>{mockData.apy}</div>
                </div>
                <div className="wrapper odd-rows-bg">
                    <div>Balance</div><div><ToolTip label="* Warning: Because you have sent/received staking share token (Loyalty Pool: WALLET-LOYALTY), the reward shown may be less than your actual reward.">{mockData.balance}</ToolTip></div>
                </div>
                <div className="wrapper">
                    <div>All time rewards</div><div>{mockData.allTimeRewards}</div>
                </div>
                <div className="wrapper odd-rows-bg">
                    <div>Total Deposit</div><div>{mockData.totalDeposit}</div>
                </div>
                <div className="wrapper">
                    <div>Total Withdraws</div><div>{mockData.totalWithdraws}</div>
                </div>
                <div className="wrapper odd-rows-bg">
                    <div>Pending to unlock</div><div>{mockData.pendingToUnlock}</div>
                </div>
                <div className="wrapper">
                    <div>Ready to withdraw</div><div>{mockData.readyToWithdraw}</div>
                </div>
            </>) :
            (<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>)}
        </Modal>
    )
}

export default MoreDetailsModal
