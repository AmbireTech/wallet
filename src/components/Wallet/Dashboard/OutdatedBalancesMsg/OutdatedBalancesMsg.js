import styles from './OutdatedBalancesMsg.module.scss'
import { ReactComponent as AlertIcon } from 'resources/icons/alert.svg'
// import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'

const OutdatedBalancesMsg = ({ selectedAccount, selectedNetwork }) => {
    return (
        <div className={styles.wrapper}>
            <div className={styles.alertWrapper}>
                <div className={styles.alert}>
                    <AlertIcon />
                    <div className={styles.body}>
                        <h4 className={styles.title}>Dashboard balances could appear incomplete or outdated.</h4>
                        <p className={styles.text}>
                            We are currently experiencing technical difficulties with our third party services, 
                            so what you see on the dashboard may be incomplete or outdated. You can check
                            {' '}
                            <a
                                href={selectedNetwork.explorerUrl+'/address/'+ selectedAccount} 
                                target='_blank' 
                                rel='noreferrer'
                                className={styles.link}
                            >
                                {selectedNetwork.explorerUrl.split('/')[2]}
                            </a>
                            {' '}
                            to see your current balances. However, you can use Ambire normally with any connected dApp.
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
}

export default OutdatedBalancesMsg