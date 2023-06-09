import { FaCheck } from 'react-icons/fa'
import buildRecoveryBundle from 'lib/recoveryBundle'
import { ReactComponent as WarningIcon } from 'resources/icons/alert.svg'

const PendingRecoveryNotice = ({
  recoveryLock,
  showSendTxns,
  selectedAccount,
  selectedNetwork
}) => {
  const isAlreadyInitiated = recoveryLock && recoveryLock.status !== 'requestedButNotInitiated'
  const createRecoveryRequest = async () => {
    if (isAlreadyInitiated) return
    const bundle = buildRecoveryBundle(
      selectedAccount.id,
      selectedNetwork.id,
      selectedAccount.signer.preRecovery,
      { signer: selectedAccount.signer, primaryKeyBackup: selectedAccount.primaryKeyBackup }
    )
    showSendTxns(bundle, true)
  }
  const recoveryLockStatus = recoveryLock ? recoveryLock.status : 'requestedButNotInitiated'
  const remainingTime = (seconds) => {
    if (seconds > 86400) return `${Math.ceil(seconds / 86400)} days`
    return `${Math.ceil(seconds / 1440)} hours`
  }
  const styleClass = isAlreadyInitiated
    ? recoveryLockStatus === 'ready'
      ? 'success'
      : 'warning'
    : 'warning action'

  return (
    <div
      className={`notification-banner notification-hollow ${styleClass}`}
      onClick={() => createRecoveryRequest()}
    >
      {recoveryLockStatus === 'ready' ? <FaCheck /> : <WarningIcon />}

      {recoveryLockStatus === 'requestedButNotInitiated' ? (
        <>
          Password reset requested but not initiated for {selectedNetwork.name}. Click here to
          initiate it.
        </>
      ) : recoveryLockStatus === 'initiationTxnPending' ? (
        <>
          Initiation transaction is currently pending. Once mined, you will need to wait{' '}
          {remainingTime(recoveryLock.timelock)} for the reset to be done on {selectedNetwork.name}.
        </>
      ) : recoveryLockStatus === 'waitingTimelock' ? (
        <>
          Password reset on {selectedNetwork.name} is currently pending.{' '}
          {remainingTime(recoveryLock.remaining)} remaining.
        </>
      ) : recoveryLockStatus === 'ready' ? (
        <>
          Password reset on {selectedNetwork.name} is now complete! You can start signing
          transactions with your new password!
        </>
      ) : recoveryLockStatus === 'failed' ? (
        <>
          Something went wrong while resetting your password. Please contact support at
          help.ambire.com
        </>
      ) : null}
    </div>
  )
}

export default PendingRecoveryNotice
