import styles from './OfflineMsg.module.scss'
import { ReactComponent as AlertIcon } from 'resources/icons/alert.svg'

const OfflineMsg = () => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.alertWrapper}>
                <div className={styles.alert}>
                    <AlertIcon />
                    <div className={styles.body}>
                        <h4 className={styles.title}>No Internet Connection</h4>
                    </div>
                </div>
            </div>
            <div className={styles.shadow} />
        </div>
    )
}

export default OfflineMsg