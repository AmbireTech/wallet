import React from 'react'
import cn from 'classnames'
import { MdOutlineDelete } from 'react-icons/md'
import styles from './AddressList.module.scss'

const AddressList = ({ noAccounts, addresses, onSelectAddress, removeAddress, className }) => {
  const items = addresses.filter(({ isAccount }) => !(isAccount && noAccounts))

  return (
    <div className={cn(styles.wrapper, className)}>
      {!items.length ? (
        <div className={styles.placeholder}>Your Address Book is empty</div>
      ) : (
        items.map(({ isAccount, icon, name, address, type }) => (
          <div className={styles.item} key={address + name}>
            <div
              className={styles.inner}
              onClick={() => onSelectAddress && onSelectAddress(address)}
            >
              <div className={styles.icon} style={{ backgroundImage: `url(${icon})` }} />
              <div className={styles.details}>
                <label>{name}</label>
                <div className={styles.address}>{address}</div>
              </div>
            </div>
            {!isAccount ? (
              <div className={styles.button} onClick={() => removeAddress(name, address, type)}>
                <MdOutlineDelete />
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}

export default AddressList
