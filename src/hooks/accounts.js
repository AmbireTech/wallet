import { useCallback } from 'react'
import { useToasts } from 'hooks/toasts'
import { useHistory } from 'react-router-dom'
import useAccountsCommon from 'ambire-common/src/hooks/useAccounts'

export default function useAccounts (useStorage) {
    const history = useHistory()

    const onAdd = useCallback(() => history.push('/wallet/dashboard'), [history])
    const onRemoveLastAccount = useCallback(() => history.push('/add-account'), [history])

    const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccountsCommon({
      useStorage,
      useToasts,
      onAdd,
      onRemoveLastAccount
    });

    return { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount }
  }
