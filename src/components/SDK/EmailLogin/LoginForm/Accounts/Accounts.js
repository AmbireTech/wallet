import BaseAccounts from 'components/Wallet/TopBar/Accounts/Accounts'
import { useLocalStorage } from 'hooks'

import styles from './Accounts.module.scss'

const Accounts = ({ accounts, selectedAddress, onSelectAcc, hidePrivateValue }) => {
  const [userSorting, setUserSorting] = useLocalStorage({
    key: 'userSorting',
    defaultValue: {},
  })

  return (
    <div className={styles.wrapper}>
      <BaseAccounts
        accounts={accounts}
        selectedAddress={selectedAddress}
        onSelectAcc={onSelectAcc}
        onRemoveAccount={() => {}}
        hidePrivateValue={hidePrivateValue}
        userSorting={userSorting}
        setUserSorting={setUserSorting}
        isSDK={true}
      ></BaseAccounts>
    </div>
  )
}

export default Accounts
