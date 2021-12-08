import { MdOutlineWarningAmber } from "react-icons/md"
import { AbiCoder, keccak256 } from 'ethers/lib/utils'
import buildRecoveryBundle from '../../../../helpers/recoveryBundle'

const PendingRecoveryNotice = ({ recoveryLock, showSendTxns, selectedAccount, selectedNetwork }) => {
    const createRecoveryRequest = async () => {
        const abiCoder = new AbiCoder()
        const { timelock, one, two } = selectedAccount.signer
        const quickAccountTuple = [timelock, one, two]
        const newQuickAccHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
        const bundle = buildRecoveryBundle(selectedAccount.id, selectedNetwork.id, selectedAccount.signer.preRecovery, newQuickAccHash)
        showSendTxns(bundle)
    }

    return (
        recoveryLock && recoveryLock.status ?
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