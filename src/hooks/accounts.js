import { useCallback } from 'react'
import { useToasts } from 'hooks/toasts'
import { useHistory } from 'react-router-dom'

export default function useAccounts (useStorage) {
    const { addToast } = useToasts()
    const history = useHistory()

    const [accounts, setAccounts] = useStorage({
      key: 'accounts',
      defaultValue: [],
      setInit: initialAccounts => {
        if (!Array.isArray(initialAccounts)) {
          console.error('accounts: incorrect format')

          return []
        }

        return initialAccounts
      }}
    )
    const [selectedAcc, setSelectedAcc] = useStorage({
      key: 'selectedAcc',
      defaultValue: '',
      isStringStorage: true,
      setInit: initialSelectedAcc => {
        if (!initialSelectedAcc || !accounts.find(x => x.id === initialSelectedAcc)) {
          return accounts[0] ? accounts[0].id : ''
        }

        return initialSelectedAcc
    }})

    const onSelectAcc = useCallback(selected => {
      setSelectedAcc(selected)
    }, [setSelectedAcc])
    const onAddAccount = useCallback((acc, opts = {}) => {
      if (!(acc.id && acc.signer)) throw new Error('account: internal err: missing ID or signer')

      const existing = accounts.find(x => x.id.toLowerCase() === acc.id.toLowerCase())
      if (existing) {
        addToast(JSON.stringify(existing) === JSON.stringify(acc) ? 'Account already added' : 'Account updated')
      } else if (opts.isNew) {
        // @TODO consider something more explanatory such as "using Trezor as a signer", or "this is different from your signer address"
        addToast(`New Ambire account created: ${acc.id}${acc.signer.address ? '. This is a fresh smart wallet address.' : ''}`, { timeout: acc.signer.address ? 15000 : 10000 })
      }

      const existingIdx = accounts.indexOf(existing)
        if (existingIdx === -1) accounts.push(acc)
      else accounts[existingIdx] = acc

      // need to make a copy, otherwise no rerender
      setAccounts([ ...accounts ])

      if (opts.select) onSelectAcc(acc.id)
      if (Object.keys(accounts).length) {
        history.push('/wallet/dashboard')
      }
    }, [accounts, addToast, onSelectAcc, history, setAccounts])

    const onRemoveAccount = useCallback(id => {
      if (!id) throw new Error('account: internal err: missing ID/Address')

      const account = accounts.find(account => account.id === id)
      if (account && account.email && account.cloudBackupOptout && !account.downloadedBackup)
        return addToast('You have opted out of Ambire Cloud Backup. Please backup your account before logging out.', { error: true, route: '/wallet/security' })

      const clearedAccounts = accounts.filter(account => account.id !== id)
      setAccounts([...clearedAccounts])

      if (!clearedAccounts.length) history.push('/add-account')
      else onSelectAcc(clearedAccounts[0].id)
    }, [accounts, history, onSelectAcc, addToast, setAccounts])

    return { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount }
  }
