import styles from './AddressList.module.scss'

import { MdOutlineDelete } from 'react-icons/md'

const AddressList = ({ noAccounts, addresses, onSelectAddress, removeAddress }) => {
    const items = addresses.filter(({ isAccount }) => !(isAccount && noAccounts))

    return (
        <div className={styles.wrapper}>
            {
                !items.length ?
                    <div className={styles.placeholder}>Your Address Book is empty</div>
                    :
                    items.map(({ isAccount, icon, name, address, type }) => (
                        <div className={styles.item} key={address + name}>
                            <div className={styles.inner} onClick={() => onSelectAddress && onSelectAddress(address)}>
                                <div className={styles.icon} style={{ backgroundImage: `url(${icon})`}}></div>
                                <div className={styles.details}>
                                    <label>{ name }</label>
                                    <div className="address">{ address }</div>
                                </div>
                            </div>
                            {
                                !isAccount ? 
                                    <div className={styles.button} onClick={() => removeAddress(name, address, type)}>
                                        <MdOutlineDelete/>
                                    </div>
                                    :
                                    null
                            }
                        </div>
                    ))
            }
        </div>
    )
}

export default AddressList