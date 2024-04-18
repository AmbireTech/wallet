import { IoIosWarning } from 'react-icons/io'
import styles from './DAppIncompatibilityWarningMsg.module.scss'

export default function DAppIncompatibilityWarningMsg({
  title = 'Warning',
  msg = 'If you have trouble validating this message with the dApp, most likely it does not support smart wallet signatures. Ambire Wallet has no control over those dApps and can not reach out to all of them, and we recommend you report this to the dApp in order to add such support and allow you to use it flawlessly.'
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.title}>
        <IoIosWarning />
        {title}
      </div>
      <div className={styles.message}>{msg}</div>
    </div>
  )
}
