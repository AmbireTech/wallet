import { useCallback, useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { useHistory } from 'react-router-dom'
import useAccountsCommon from 'ambire-common/src/hooks/useAccounts'

export default function useAccounts (useStorage) {
    const history = useHistory()
    const [pluginUrl, setPluginUrl] = useState(null)

    // const onAdd = useCallback(() => history.push('/wallet/dashboard'), [history])
    const onAdd = useCallback(() => {
      if(pluginUrl) {
        history.push(`/wallet/dapps?dappUrl=${encodeURIComponent(pluginUrl + `?${Date.now()}`)}`) 
      } else if (history.location.pathname !== '/wallet/security') {
        history.push('/wallet/dashboard')
      }
    }, [history, pluginUrl])
    const onRemoveLastAccount = useCallback(() => history.push('/add-account'), [history])
    const onRemoveAccountWithoutBackingItUp =
      useCallback(() => history.push('/wallet/security'), [history]);

    const { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount } = useAccountsCommon({
      useStorage,
      useToasts,
      onAdd,
      onRemoveLastAccount,
      onRemoveAccountWithoutBackingItUp
    });

    return { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount, setPluginUrl }
  }
