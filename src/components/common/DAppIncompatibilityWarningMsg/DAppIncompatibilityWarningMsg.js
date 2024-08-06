import { IoIosWarning } from 'react-icons/io'
import styles from './DAppIncompatibilityWarningMsg.module.scss'

export default function DAppIncompatibilityWarningMsg({
  title = 'Warning',
  msg = 'If you have trouble validating this message with the dApp, most likely it does not support smart wallet signatures. Ambire Wallet has no control over those dApps and can not reach out to all of them. We recommend you to migrate to the Ambire Extension, which supports signing all types of messages: https://www.ambire.com.'
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
