/* eslint-disable import/no-cycle */
import cn from 'classnames'

import { ResponsiveAddress } from 'components/common'

import { MdOutlineDelete } from 'react-icons/md'

import styles from './AddressList.module.scss'

const AddressList = ({
  noAccounts,
  addresses,
  onSelectAddress,
  removeAddress,
  className,
  addressClassName
}) => {
  const items = addresses.filter(({ isAccount }) => !(isAccount && noAccounts))

  return (
    <div className={cn(styles.wrapper, className)}>
      {!items.length ? (
        <div className={styles.placeholder}>Your Address Book is empty</div>
      ) : (
        items.map(({ isAccount, icon, name, address, type }) => (
          <div className={cn(styles.item, addressClassName)} key={address + name}>
            <button
              type="button"
              className={styles.inner}
              onClick={() => onSelectAddress && onSelectAddress(address)}
            >
              <div className={styles.icon} style={{ backgroundImage: `url(${icon})` }} />
              <div className={styles.details}>
                <p className={styles.addressName}>{name}</p>
                <ResponsiveAddress className={styles.address} address={address} />
              </div>
            </button>
            {!isAccount ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => removeAddress(name, address, type)}
              >
                <MdOutlineDelete />
              </button>
            ) : null}
          </div>
        ))
      )}
    </div>
  )
}

export default AddressList
