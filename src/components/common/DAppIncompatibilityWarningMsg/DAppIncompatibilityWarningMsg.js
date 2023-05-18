import { IoIosWarning } from 'react-icons/io'
import styles from './DAppIncompatibilityWarningMsg.module.scss'

export default function DAppIncompatibilityWarningMsg({
  title = 'Warning',
  msg = 'It is highly likely that this dapp does not support smart wallet signatures. This is a highly disruptive practice, as it breaks support for all smart wallets (Ambire, Gnosis Safe and others). We recommend you report this to the dApp ASAP and ask them to fix it.'
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
