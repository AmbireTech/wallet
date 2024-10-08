import { useCallback, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MdOutlineClose, MdOutlineCheck, MdDragIndicator, MdOutlineSort } from 'react-icons/md'

import * as blockies from 'blockies-ts'
import { DropDown, Button, ToolTip } from 'components/common'
import { useToasts } from 'hooks/toasts'
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import cn from 'classnames'

import { ReactComponent as LogOut } from 'resources/icons/log-out.svg'
import { ReactComponent as Copy } from 'resources/icons/copy.svg'
import styles from './Accounts.module.scss'

const Accounts = ({
  accounts,
  selectedAddress,
  onSelectAcc,
  onRemoveAccount,
  hidePrivateValue,
  userSorting,
  setUserSorting
}) => {
  const { addToast } = useToasts()
  const [logoutWarning, setLogoutWarning] = useState(false)
  const [closed, setClosed] = useState(false)

  const isMobileScreen = useCheckMobileScreen()

  const sortType = userSorting.accounts?.sortType || 'default'

  const onDropEnd = (list) => {
    setUserSorting((prev) => ({
      ...prev,
      accounts: {
        sortType: 'custom',
        items: list
      }
    }))
  }

  const { dragStart, dragEnter, dragTarget, target, handle, drop } = useDragAndDrop('id', onDropEnd)

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        if (sortType === 'custom' && userSorting.accounts?.items?.length) {
          return userSorting.accounts.items.indexOf(a.id) - userSorting.accounts.items.indexOf(b.id)
        }
        return accounts.indexOf(a.id) - accounts.indexOf(b.id)
      }),
    [accounts, sortType, userSorting]
  )

  const isDraggable = useMemo(
    () => sortedAccounts.length > 1 && sortType === 'custom' && !isMobileScreen,
    [sortedAccounts, sortType, isMobileScreen]
  )

  // On mobile screens we are showing more characters of the address,
  // because we have more space there (the dropdowns take full width)
  const shortenedAddress = useCallback(
    (address) => `${address.slice(0, isMobileScreen ? 8 : 5)}...${address.slice(-3)}`,
    [isMobileScreen]
  )
  const isActive = useCallback(
    (id) => (id === selectedAddress ? styles.active : ''),
    [selectedAddress]
  )
  const toIcon = useCallback((seed) => blockies.create({ seed }).toDataURL(), [])
  const toIconBackgroundImage = useCallback(
    (seed) => ({ backgroundImage: `url(${toIcon(seed)})` }),
    [toIcon]
  )
  const walletType = useCallback((signerExtra) => {
    if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
    if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
    return 'Web3'
  }, [])
  const copyAddress = useCallback(
    async (address) => {
      await navigator.clipboard.writeText(address)
      addToast('Copied to clipboard!')
    },
    [addToast]
  )

  const copySelectedAddress = useCallback(
    (e) => {
      e.stopPropagation()
      copyAddress(selectedAddress)
    },
    [copyAddress, selectedAddress]
  )

  const onSelectAccount = useCallback(
    (id) => {
      onSelectAcc(id)
      setClosed(true)
    },
    [onSelectAcc, setClosed]
  )

  return (
    <DropDown
      className={styles.wrapper}
      menuClassName={styles.menu}
      icon={toIcon(selectedAddress)}
      title={
        <>
          <p>{hidePrivateValue(shortenedAddress(selectedAddress))}</p>
          <Copy onClick={copySelectedAddress} className={styles.selectedAddressCopyIcon} />
        </>
      }
      titleClassName={styles.selectedAddress}
      open={closed}
      onOpen={() => setClosed(false)}
    >
      <div className={styles.list}>
        {!isMobileScreen && (
          <div className={styles.sortButtons}>
            <ToolTip label="Sorted accounts by drag and drop">
              <MdDragIndicator
                color={sortType === 'custom' ? '#27e8a7' : ''}
                cursor="pointer"
                onClick={() =>
                  setUserSorting((prev) => ({
                    ...prev,
                    accounts: {
                      ...prev.accounts,
                      sortType: 'custom'
                    }
                  }))
                }
              />
            </ToolTip>
            <ToolTip label="Sorted accounts by default">
              <MdOutlineSort
                color={sortType === 'default' ? '#27e8a7' : ''}
                cursor="pointer"
                onClick={() =>
                  setUserSorting((prev) => ({
                    ...prev,
                    accounts: {
                      ...prev.accounts,
                      sortType: 'default'
                    }
                  }))
                }
              />
            </ToolTip>
          </div>
        )}
        {sortedAccounts.map(({ id, email, signer, signerExtra }, i) =>
          logoutWarning !== id ? (
            <div
              className={`${styles.account} ${isActive(id)}`}
              key={id}
              draggable={isDraggable}
              onDragStart={(e) => {
                if (handle.current === target.current || handle.current.contains(target.current))
                  dragStart(e, i)
                else e.preventDefault()
              }}
              onMouseDown={(e) => dragTarget(e, i)}
              onDragEnter={(e) => dragEnter(e, i)}
              onDragEnd={(e) => drop(sortedAccounts)}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className={styles.inner} onClick={() => onSelectAccount(id)}>
                {isDraggable && (
                  <MdDragIndicator className={styles.dragHandle} id={`${i}-handle`} />
                )}
                <div className={styles.icon} style={toIconBackgroundImage(id)} />
                <div className={styles.details}>
                  <div className={styles.addressAndBadge}>
                    <div className={styles.address}>{id}</div>
                    <div className={styles.badge}>Ambire v1</div>
                  </div>
                  <label>
                    {email
                      ? `Email/Password account (${email})`
                      : `${walletType(signerExtra)} (${shortenedAddress(signer.address)})`}
                  </label>
                </div>
              </div>
              <div className={styles.buttons}>
                <button type="button" className={styles.button} onClick={() => copyAddress(id)}>
                  <Copy />
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setLogoutWarning(id)}
                >
                  <LogOut />
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`${styles.account} ${isActive(id)} ${styles.confirmDeleteAccount}`}
              key={id}
            >
              <p className={styles.message}>Are you sure you want to log out from this account ?</p>
              <div className={styles.buttons}>
                <button
                  type="button"
                  className={cn(styles.button, styles.danger)}
                  onClick={() => {
                    setLogoutWarning(false)
                    onRemoveAccount(id)
                  }}
                >
                  <MdOutlineCheck />
                </button>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => setLogoutWarning(false)}
                >
                  <MdOutlineClose />
                </button>
              </div>
            </div>
          )
        )}
      </div>
      <div className={styles.addAccount}>
        <NavLink to="/add-account">
          <Button size="sm" variant="primaryGradient">
            Add Account
          </Button>
        </NavLink>
      </div>
    </DropDown>
  )
}

export default Accounts
