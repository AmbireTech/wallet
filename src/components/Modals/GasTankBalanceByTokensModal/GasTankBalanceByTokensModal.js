import { Button, Modal } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

import styles from './GasTankBalanceByTokensModal.module.scss'

const GasTankBalanceByTokensModal = ({ data }) => {
    const { hideModal } = useModals()        
    
    return (
        <Modal 
        className={styles.wrapper} 
        title="Gas Tank Balance by Tokens" 
        buttons={
            <Button clear icon={<MdOutlineClose/>} onClick={hideModal}>
                Close
            </Button>
        }>
           <div className={styles.content}>
                <div className={styles.row}>
                    <div className={styles.logo}> </div>
                    <div className={styles.item}>
                        <span>Token</span>
                    </div>
                    <div className={styles.balance}>
                        <span>Amount</span>
                    </div>
                    <div className={styles.balance}>
                        <span>Balance</span>
                    </div>
                </div>
                {
                    data && data.sort((a, b) => b.balance - a.balance).map((item, key) => {
                        return (
                            <div className={styles.row} key={key}>
                                <div className={styles.logo}>
                                    <img width="25px" height='25px' alt='logo' src={item.icon || getTokenIcon(item.network, item.address)} /> 
                                </div>
                                <div className={styles.item}>
                                    <span>{ item.symbol.toUpperCase() }</span>
                                </div>
                                <div className={styles.balance}>
                                    <span>{ formatFloatTokenAmount(item.balance, true, 6) }</span>
                                </div>
                                <div className={styles.balance}>
                                    <span>$ {formatFloatTokenAmount(item.balanceInUSD, true, 6) }</span>
                                </div>
                            </div>
                        )
                    })
                }
           </div>
        </Modal>
    )
}

export default GasTankBalanceByTokensModal