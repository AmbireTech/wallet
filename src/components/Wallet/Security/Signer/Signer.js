import useConstants from 'hooks/useConstants'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { getName } from 'lib/humanReadableTransactions'
import styles from './Signer.module.scss'
import { Button } from 'components/common'

const Signer = ({ addr, privValue, selectedAccount, hasPendingReset, relayerURL, handleDisableOtp, handleEnableOtp }) => {
  const otpEnabled = relayerURL ? relayerURL.otpEnabled : null
  const { constants: { humanizerInfo } } = useConstants()

  if (!privValue) return null
  
  const addressName = getName(humanizerInfo, addr) || null
  const isQuickAcc = addr === accountPresets.quickAccManager
  const privText = isQuickAcc
    ? `Email/password signer (${selectedAccount.email || 'unknown email'})`
    : `${addr} ${addressName && addressName !== addr ? `(${addressName})` : ''}`
  const signerAddress = isQuickAcc
    ? selectedAccount.signer.quickAccManager
    : selectedAccount.signer.address
  const isSelected = signerAddress === addr
  const canChangePassword = isQuickAcc && !hasPendingReset

  return (
    <div className={styles.wrapper}>
      <div className={styles.manage}>
        Checkbox
        Remove icon
      </div>
      <label></label>
      {isQuickAcc && (otpEnabled !== null) && (otpEnabled ? 
          <Button red onClick={handleDisableOtp}>Disable 2FA</Button> : 
          <Button primaryGradient onClick={handleEnableOtp}>Enable 2FA</Button>
        )}
      {/* {privText} */}
      {/* {addr} */}
    </div>
  )
}

export default Signer