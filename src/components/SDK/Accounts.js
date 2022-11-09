import styles from 'components/Wallet/TopBar/Accounts/Accounts.module.scss'

import { useState } from 'react';
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'
import { useLocalStorage } from 'hooks'

import * as blockies from 'blockies-ts';
import { DropDown } from 'components/common';
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import { ToolTip } from 'components/common'

const Accounts = ({ accounts, selectedAddress, onSelectAcc, hidePrivateValue }) => {
  const [closed, setClosed] = useState(false)

  const isMobileScreen = useCheckMobileScreen()

  const [userSorting, setUserSorting] = useLocalStorage({
    key: 'userSorting',
    defaultValue: {}
  })

  const sortType = userSorting.accounts?.sortType || 'default'

  const onDropEnd = (list) => {
    setUserSorting(
      prev => ({
        ...prev,
        accounts: {
          sortType: 'custom',
          items: list
        }
      })
    )
  }

  const {
    dragStart,
    dragEnter,
    dragTarget,
    target,
    handle,
    drop
  } = useDragAndDrop('id', onDropEnd)

  const sortedAccounts = [...accounts].sort((a, b) => {
    if (sortType === 'custom' && userSorting.accounts?.items?.length) {
      const sorted = userSorting.accounts.items.indexOf(a.id) - userSorting.accounts.items.indexOf(b.id)
      return sorted
    } else {
      const sorted = accounts.indexOf(a.id) - accounts.indexOf(b.id)
      return sorted
    }
  })

  const shortenedAddress = address => address.slice(0, 5) + '...' + address.slice(-3)
  const isActive = id => id === selectedAddress ? styles.active : ''
  const toIcon = seed => blockies.create({ seed }).toDataURL()
  const toIconBackgroundImage = seed => ({ backgroundImage: `url(${toIcon(seed)})`})
  const walletType = signerExtra => {
    if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
    else if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
    else return 'Web3'
  }

  const onSelectAccount = (id) => {
    onSelectAcc(id)
    setClosed(true)
  }

  return (
    <DropDown
      className={styles.wrapper}
      menuClassName={styles.menu}
      icon={toIcon(selectedAddress)}
      title={hidePrivateValue(shortenedAddress(selectedAddress))}
      open={closed}
      onOpen={() => setClosed(false)}
    >
      <div className={styles.list}>
        {!isMobileScreen && <div className={styles.sortButtons}>
          <ToolTip label='Sorted accounts by drag and drop'>
              <MdDragIndicator color={sortType === "custom" ? "#80ffdb" : ""} cursor="pointer"
              onClick={() => setUserSorting(prev => ({
                  ...prev,
                  accounts: {
                      ...prev.accounts,
                      sortType: 'custom'
                  }
              }))} />
          </ToolTip>
          <ToolTip label='Sorted accounts by default'>
              <MdOutlineSort color={sortType === "default" ? "#80ffdb" : ""} cursor="pointer"
              onClick={() => setUserSorting(prev => ({
                  ...prev,
                  accounts: {
                      ...prev.accounts,
                      sortType: 'default'
                  }
              }))} />
          </ToolTip>
        </div>}
        {
          sortedAccounts.map(({ id, email, signer, signerExtra }, i) =>
            <div
                className={`${styles.account} ${isActive(id)}`}
                key={id}
                draggable={sortedAccounts.length > 1 && sortType === 'custom' && !isMobileScreen}
                onDragStart={(e) => {
                    if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, i)
                    else e.preventDefault();
                    }}
                onMouseDown={(e) => dragTarget(e, i)}
                onDragEnter={(e) => dragEnter(e, i)}
                onDragEnd={(e) => drop(sortedAccounts)}
                onDragOver={(e) => e.preventDefault()}
            >
                <div className={styles.inner} onClick={() => onSelectAccount(id)}>
                    {sortedAccounts.length > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator className={styles.dragHandle} id={`${i}-handle`} />}
                    <div className={styles.icon} style={toIconBackgroundImage(id)}></div>
                    <div className={styles.details}>
                        <div className={styles.address}>{ id }</div>
                        <label>{ email ? `Email/Password account (${email})` : `${walletType(signerExtra)} (${shortenedAddress(signer.address)})` }</label>
                    </div>
                </div>
            </div>
          )
        }
      </div>
    </DropDown>
  )
}

export default Accounts