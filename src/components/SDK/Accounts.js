import BaseAccounts from 'components/Wallet/TopBar/Accounts/Accounts'
import { useLocalStorage } from 'hooks'

const Accounts = ({ accounts, selectedAddress, onSelectAcc, hidePrivateValue }) => {
  const [userSorting, setUserSorting] = useLocalStorage({
    key: 'userSorting',
    defaultValue: {}
  })

  return (
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
  )
}

export default Accounts