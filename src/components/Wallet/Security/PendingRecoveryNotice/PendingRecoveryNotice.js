import { MdOutlineWarningAmber } from "react-icons/md"
import buildRecoveryBundle from 'lib/recoveryBundle'
import { Bundle } from 'adex-protocol-eth'

// 10% in geth and most EVM chain RPCs; relayer wants 12%
const RBF_THRESHOLD = 1.14

const PendingRecoveryNotice = ({ recoveryLock, showSendTxns, selectedAccount, selectedNetwork, relayerURL }) => {
    const isAlreadyInitiated = recoveryLock && recoveryLock.status !== 'requestedButNotInitiated'
    const createRecoveryRequest = async () => {
        if (isAlreadyInitiated) return
        const bundle = buildRecoveryBundle(
            selectedAccount.id,
            selectedNetwork.id,
            selectedAccount.signer.preRecovery,
            { signer: selectedAccount.signer, primaryKeyBackup: selectedAccount.primaryKeyBackup }
        )
        showSendTxns(bundle)
    }
    const bundle = recoveryLock && new Bundle({ ...recoveryLock, ...selectedAccount, network: selectedNetwork.id })
    console.log('bundle', bundle, selectedAccount)

    const mapToBundle = (relayerBundle, extra = {}) => (new Bundle({
        ...relayerBundle,
        nonce: relayerBundle.nonce.num,
        gasLimit: null,
        replacesTxId: recoveryLock.txHash,
        // Instruct the relayer to abide by this minimum fee in USD per gas, to ensure we are truly replacing the txn
        minFeeInUSDPerGas: relayerBundle.feeInUSDPerGas * RBF_THRESHOLD,
        ...extra
    }))
    const cancelByReplacing = relayerBundle => showSendTxns(mapToBundle(relayerBundle, {
     txns: [[selectedAccount.id, '0x0', '0x']],
    }))
    const cancel = () => {
        // debugger
        // @TODO relayerless
        bundle.cancel({ relayerURL, fetch })
          .then(({ success, message }) => {
            if (!success) {
              if (message.includes('not possible to cancel')) {
                // addToast('Transaction already picked up by the network, you will need to pay a fee to replace it with a cancellation transaction.')
              } else {
                // addToast(`Not possible to cancel: ${message}, you will need to pay a fee to replace it with a cancellation transaction.`)
              }
              cancelByReplacing(bundle)
            } else {
            //   addToast('Transaction cancelled successfully')
            }
          })
          .catch(e => {
            console.error(e)
            // cancelByReplacing(bundle)
          })
      }
    const recoveryLockStatus = recoveryLock ? recoveryLock.status : 'requestedButNotInitiated'
    console.log({recoveryLock, recoveryLockStatus})
    const remainingTime = seconds => {
        if (seconds > 86400) return `${Math.ceil(seconds / 86400)} days`
        else return `${Math.ceil(seconds/1440)} hours`
    }
    const style = isAlreadyInitiated
        ? (recoveryLockStatus === 'ready' ? { 'background-color': '#6bad6b' } : {})
        : { cursor: 'pointer' }
    return (
        <div className="notice" style={style} onClick={() => createRecoveryRequest()}>
            <MdOutlineWarningAmber/>
            {
                recoveryLockStatus === 'requestedButNotInitiated' ?
                    <>Password reset requested but not initiated for {selectedNetwork.name}. Click here to initiate it.</> :
                recoveryLockStatus === 'initiationTxnPending' ?
                    <>Initiation transaction is currently pending. Once mined, you will need to wait {remainingTime(recoveryLock.timelock)} for the reset to be done on {selectedNetwork.name}.</> :
                recoveryLockStatus === 'waitingTimelock' ?
                    <>Password reset on {selectedNetwork.name} is currently pending. {remainingTime(recoveryLock.remaining)} remaining. <div onClick={cancel}>Cancel</div></> :
                recoveryLockStatus === 'ready' ?
                    <>Password reset on {selectedNetwork.name} is now complete! You can start signing transactions with your new password!</> :
                recoveryLockStatus === 'failed' ?
                    <>Something went wrong while resetting your password. Please contact support at help.ambire.com</> : null
            }
        </div>
    )
}

export default PendingRecoveryNotice