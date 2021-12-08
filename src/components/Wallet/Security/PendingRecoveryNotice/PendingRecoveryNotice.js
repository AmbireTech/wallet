import { MdOutlineWarningAmber } from "react-icons/md"
import buildRecoveryBundle from '../../../../helpers/recoveryBundle'
import './PendingRecoveryNotice.scss'

const PendingRecoveryNotice = ({ recoveryLock, showSendTxns, selectedAccount, selectedNetwork }) => {
    const createRecoveryRequest = async () => {
        const bundle = buildRecoveryBundle(
            selectedAccount.id,
            selectedNetwork.id,
            selectedAccount.signer.preRecovery,
            { signer: selectedAccount.signer, primaryKeyBackup: selectedAccount.primaryKeyBackup }
        )
        showSendTxns(bundle)
    }
    const recoveryLockStatus = recoveryLock ? recoveryLock.status : 'requestedButNotInitiated'

    return (
        <div className="notice" id="recovery-request-pending" onClick={() => createRecoveryRequest()}>
            <MdOutlineWarningAmber/>
            {
                recoveryLockStatus === 'requestedButNotInitiated' ?
                    <>Password reset requested but not initiated for {selectedNetwork.name}. Click here to initiate it.</> :
                recoveryLockStatus === 'initiationTxnPending' ?
                    <>Initiation transaction is currently pending. Once mined, you will need to wait {recoveryLock.days} days for the reset to be done on {selectedNetwork.name}.</> :
                recoveryLockStatus === 'waitingTimelock' ?
                    <>Password reset on {selectedNetwork.name} is currently pending. {recoveryLock.remainingDays} days remaining.</> :
                recoveryLockStatus === 'ready' ?
                    <>Password recovery was requested but is not initiated for {selectedNetwork.name}. Click here to do so.</> :
                recoveryLockStatus === 'failed' ?
                    <>Something went wrong while resetting your password. Please contact support at help.ambire.com</> : null
            }
        </div>
    )
}

export default PendingRecoveryNotice