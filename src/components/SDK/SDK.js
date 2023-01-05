import { ReactComponent as AmbireLogoIcon } from 'resources/logo.svg'
import styles from './SDK.module.scss'

const SDK = ({children}) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.headerAndBody}>
        <div className={styles.header}>
          <span className={styles.tempLogo}>Logo</span>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
      <div className={styles.footer}>
        <p className={styles.footerText}>Powered by Ambire Wallet</p>
        <AmbireLogoIcon className={styles.footerLogo} />
      </div>
    </div>
  )
}

export default SDK
