import cn from 'classnames'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import { getName } from 'lib/humanReadableTransactions'
import { useModals } from 'hooks'
import useConstants from 'hooks/useConstants'
import { Button, Checkbox } from 'components/common'
import RemoveSignerModal from 'components/Modals/RemoveSignerModal/RemoveSignerModal'

import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import styles from './Signer.module.scss'

const Signer = ({ 
  addr,
  addToast,
  privValue, 
  selectedAccount, 
  hasPendingReset,
  relayerData,
  handleDisableOtp, 
  handleEnableOtp,
  onMakeDefaultBtnClicked,
  onRemoveBtnClicked,
  showResetPasswordModal,
}) => {
  const { showModal } = useModals()

  const otpEnabled = relayerData ? relayerData.otpEnabled : null
  const { constants: { humanizerInfo } } = useConstants()

  if (!privValue) return null
  
  const addressName = getName(humanizerInfo, addr) || null
  const isQuickAcc = addr === accountPresets.quickAccManager
  const privText = isQuickAcc
    ? (selectedAccount.email || 'unknown email')
    : `${addr} ${addressName && addressName !== addr ? `(${addressName})` : ''}`
  const signerAddress = isQuickAcc
    ? selectedAccount.signer.quickAccManager
    : selectedAccount.signer.address
  const isSelected = signerAddress === addr
  const canChangePassword = isQuickAcc && !hasPendingReset

  const handleCheckboxClick = () => {
    if (isSelected) {
      addToast('Signer is already default.', { error: true })
      return
    } else onMakeDefaultBtnClicked(selectedAccount, addr, isQuickAcc)
  }

  const handleRemove = () => showModal(<RemoveSignerModal onClick={() => onRemoveBtnClicked(addr)} />)

  return (
    <div className={cn(styles.wrapper, {[styles.active]: isSelected})}>
      <div>
        <div className={styles.manage}>
          <Checkbox
            disabled={isSelected}
            checked={isSelected}
            onChange={handleCheckboxClick}
            className={styles.checkbox}
            labelClassName={styles.checkboxLabel}
            label={isSelected ? "Already default" : "Set as default"}
          />
          <button
            className={cn(styles.close, {[styles.disabled]: isSelected})}
            title={isSelected ? 'Cannot remove the currently used signer' : 'Remove Signer'}
            disabled={isSelected}
            onClick={handleRemove}
          >
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>
          {
            isQuickAcc ? <label className={styles.signerType}>
              Email/password signer
            </label> : null
          }
          <label className={styles.privText}>{privText}</label>
        </div>
      </div>
      <div className={styles.buttons}>
        {isQuickAcc && (otpEnabled !== null) && (otpEnabled ?
            <Button className={styles.button} red onClick={handleDisableOtp}>Disable 2FA</Button> :
            <Button className={styles.button} primaryGradient onClick={handleEnableOtp}>Enable 2FA</Button>
        )}
        {isQuickAcc && <Button
          disabled={!canChangePassword}
          className={styles.button}
          title={hasPendingReset ? 'Account recovery already in progress' : ''}
          onClick={showResetPasswordModal} 
          >
            Change password
          </Button>
        }
      </div>
    </div>
  )
}

export default Signer