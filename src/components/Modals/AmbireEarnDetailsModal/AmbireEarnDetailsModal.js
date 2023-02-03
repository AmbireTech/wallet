import './AmbireEarnDetailsModal.scss'

import { MdClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Modal, Button } from 'components/common'
import { ToolTip } from 'components/common' 
import useAmbireEarnDetails from 'hooks/useAmbireEarnDetails'
import { Loading } from 'components/common'

const AmbireEarnDetailsModal = ({ title = 'Details', apy, accountId, msToDaysHours, addresses, tokenLabel }) => {
    const { hideModal } = useModals()
    const { details, isLoading } = useAmbireEarnDetails({ accountId, addresses, tokenLabel })

    const { 
        poolShare, 
        allTimeRewards, 
        totalDeposit, 
        totalWithdraws, 
        pendingToUnlock, 
        readyToWithdraw, 
        totalOutTokenValue,
        totalInTokenValue,
        rageLeavesReceivedWalletTotal,
        rageLeavesWithdrawnWalletTotal,
        totalSharesInTransfersWalletValue,
        totalSharesOutTransfersWalletValue,
        remainingTime, 
        currentBalanceWalletAtCurrentShareValue
    } = details
    const buttons = (<Button variant="secondary" size="sm" startIcon={<MdClose />} onClick={hideModal}>Close</Button>)
   
    return (
        <Modal id="wallet-more-details-modal" title={title} buttons={buttons}>
           {!isLoading ? (
                <div className="table">
                    <div className="wrapper">
                        <div>Annual Percentage Yield (APY)</div><div>{apy}</div>
                    </div>
                    <div className="wrapper odd-rows-bg">
                        <div>Current Available Balance</div>
                        <ToolTip label="* Warning: The pool share value may include your pending to unlock tokens.">
                            <div>{parseFloat(currentBalanceWalletAtCurrentShareValue).toFixed(4)} {tokenLabel} (Pool share*: {(poolShare * 100).toFixed(2)}%)</div>
                        </ToolTip>
                    </div>
                    <div className="wrapper">
                        <div>All time rewards</div><div>{parseFloat(allTimeRewards).toFixed(4)} {tokenLabel}</div>
                    </div>
                    <div className="wrapper odd-rows-bg">
                        <div>Total deposit</div>
                        <ToolTip label={`Deposits: ${parseFloat(totalDeposit).toFixed(4)} ${tokenLabel} 
                                        \nTransfers in: ${parseFloat(totalSharesInTransfersWalletValue).toFixed(4)} ${tokenLabel}`}>
                            <div>{parseFloat(totalInTokenValue).toFixed(4)} {tokenLabel}</div>
                        </ToolTip>
                    </div>
                    <div className="wrapper">
                        <div>Total withdraws</div>
                        <ToolTip label={`Withdrawals: ${parseFloat(totalWithdraws).toFixed(4)} ${tokenLabel}
                                    \nTransfers out: ${parseFloat(totalSharesOutTransfersWalletValue).toFixed(4)} ${tokenLabel} 
                                    \nRage leaves: 
                                    \nReceived ${parseFloat(rageLeavesReceivedWalletTotal).toFixed(4)} ${tokenLabel} 
                                    \nWithdrawn ${parseFloat(rageLeavesWithdrawnWalletTotal).toFixed(4)} ${tokenLabel}`}>
                            <div>{parseFloat(totalOutTokenValue).toFixed(4)} {tokenLabel}</div>
                        </ToolTip>
                    </div>
                    <div className="wrapper odd-rows-bg">
                        <div>Total pending to unlock</div>
                        <div>
                            {remainingTime > 0 
                                ? `${msToDaysHours(remainingTime)} until ${parseFloat(pendingToUnlock).toFixed(4)} ${tokenLabel} becomes available for withdraw.` 
                                : 'No pending unlocks'}
                        </div>
                    </div>
                    <div className="wrapper">
                        <div>Ready to withdraw</div>
                        <div>
                            {parseFloat(readyToWithdraw) > 0 
                            ? `${parseFloat(readyToWithdraw).toFixed(4)} ${tokenLabel}`
                            : 'No amount for withdrawing'}
                        </div>
                    </div>
                </div>
            ) : <div className='loading-wrapper'><Loading/></div>}
        </Modal>
    )
}

export default AmbireEarnDetailsModal
