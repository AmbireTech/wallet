import { MdOutlineWarningAmber } from "react-icons/md"
import { AbiCoder, keccak256 } from 'ethers/lib/utils'
import buildRecoveryBundle from '../../../../helpers/recoveryBundle'
import './PendingRecoveryNotice.scss'

const PendingRecoveryNotice = ({ recoveryLock, privileges, showSendTxns, selectedAccount, selectedNetwork }) => {
    const accHash = signer => {
        const abiCoder = new AbiCoder()
        const { timelock, one, two } = signer
        return keccak256(abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]]))
    }
    const createRecoveryRequest = async () => {
        const bundle = buildRecoveryBundle(selectedAccount.id, selectedNetwork.id, selectedAccount.signer.preRecovery, accHash(selectedAccount.signer))
        showSendTxns(bundle)
    }

    const hasPendingReset = (recoveryLock && recoveryLock.status)
        || (
            privileges && selectedAccount.signer.quickAccManager
            // is or has been in recovery state
            && selectedAccount.signer.preRecovery
            // but that's not finalized yet
            && accHash(selectedAccount.signer) !== privileges[selectedAccount.signer.quickAccManager]
        )
    const recoveryLockStatus = recoveryLock ? recoveryLock.status : 'requestedButNotInitiated'

    return (
        hasPendingReset ?
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
        :
        null
    )
}

export default PendingRecoveryNotice