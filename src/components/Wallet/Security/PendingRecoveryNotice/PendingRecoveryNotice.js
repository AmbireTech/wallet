import { MdOutlineWarningAmber } from "react-icons/md"
import { AbiCoder, keccak256 } from 'ethers/lib/utils'
import buildRecoveryBundle from '../../../../helpers/recoveryBundle'

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
            privileges && selectedAccount.quickAccManager
            // is or has been in recovery state
            && selectedAccount.signer.preRecovery
            // but that's not finalized yet
            && accHash(selectedAccount.signer) !== privileges[selectedAccount.signer.quickAccManager]
        )

    return (
        hasPendingReset ?
            <div className="notice" id="recovery-request-pending" onClick={() => createRecoveryRequest()}>
                <MdOutlineWarningAmber/>
                {
                    recoveryLock.status === 'requestedButNotInitiated' ?
                        <>Password reset requested but not initiated for {selectedNetwork.name}. Click here to initiate it.</> :
                    recoveryLock.status === 'initiationTxnPending' ?
                        <>Initiation transaction is currently pending. Once mined, you will need to wait {recoveryLock.days} days for the reset to be done on {selectedNetwork.name}.</> :
                    recoveryLock.status === 'waitingTimelock' ?
                        <>Password reset on {selectedNetwork.name} is currently pending. {recoveryLock.remainingDays} days remaining.</> :
                    recoveryLock.status === 'ready' ?
                        <>Password recovery was requested but is not initiated for {selectedNetwork.name}. Click here to do so.</> :
                    recoveryLock.status === 'failed' ?
                        <>Something went wrong while resetting your password. Please contact support at help.ambire.com</> : null
                }
            </div>
        :
        null
    )
}

export default PendingRecoveryNotice