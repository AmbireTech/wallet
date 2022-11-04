import styles from './Alert.module.scss'
import { ReactComponent as InformationIcon } from './images/information.svg'

const Alert = ({ network }) => (
  <div className={styles.wrapper}>
    <div className={styles.alertWrapper}>
        <div className={styles.alert}>
            <InformationIcon />
            <div className={styles.body}>
              <h4 className={styles.title}>Please note: </h4>
              <p className={styles.text}>
                Signer settings are network-specific. 
                You are currently looking at and modifying 
                the signers on {network}.
                {' '}
                <a
                  href='https://help.ambire.com/hc/en-us/articles/4410885684242-Signers' 
                  target='_blank' 
                  rel='noreferrer'
                  className={styles.link}
                >
                  Need help? Click here.
                </a>
              </p>
            </div>
            {/* <button className={styles.close}>
                <CloseIcon />
            </button> */}
        </div>
    </div>
    <div className={styles.shadow} />
  </div>
)

export default Alert