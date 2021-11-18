import { useState, useCallback, useEffect } from 'react'
import { useToasts } from '../hooks/toasts'
import { useHistory } from 'react-router-dom'
import storeItem from '../helpers/storeItemDispatchEvent'

export default function useAccounts () {
    const { addToast } = useToasts()
    const history = useHistory()

    const [accounts, setAccounts] = useState(() => {
      try {
        const accs = JSON.parse(localStorage.accounts || '[]')
        if (!Array.isArray(accs)) throw new Error('accounts: incorrect format')
        return accs
      } catch (e) {
        console.error('accounts parsing failure', e)
        return []
      }
    })
    const [selectedAcc, setSelectedAcc] = useState(() => {
      const initialSelectedAcc = localStorage.selectedAcc
      if (!initialSelectedAcc || !accounts.find(x => x.id === initialSelectedAcc)) {
        return accounts[0] ? accounts[0].id : ''
      }
      return initialSelectedAcc
    })
  
    const onSelectAcc = selected => {
      localStorage.selectedAcc = selected
      setSelectedAcc(selected)
    }
    const onAddAccount = useCallback((acc, opts = {}) => {
      if (!(acc.id && acc.signer)) throw new Error('account: internal err: missing ID or signer')

      const existingIdx = accounts
        .findIndex(x => x.id.toLowerCase() === acc.id.toLowerCase())
  
      if (existingIdx !== -1) addToast('Account already added')

      if (existingIdx === -1) accounts.push(acc)
      else accounts[existingIdx] = acc
  
      // need to make a copy, otherwise no rerender
      setAccounts([ ...accounts ])
  
      storeItem('accounts', JSON.stringify(accounts))
  
      if (opts.select) onSelectAcc(acc.id)
      if (Object.keys(accounts).length) {
        history.push('/wallet/dashboard')
      }
    }, [accounts, addToast, history])
  
    const onRemoveAccount = useCallback(id => {
      if (!id) throw new Error('account: internal err: missing ID/Address')

      const clearedAccounts = accounts.filter(account => account.id !== id)
      setAccounts([...clearedAccounts])
      storeItem('accounts', JSON.stringify(clearedAccounts))
      
      if (!clearedAccounts.length) history.push('/add-account')
    }, [accounts, history])

    useEffect(() => {
      const onAccountsChanged = ({ value }) => setAccounts(JSON.parse(value))
      window.addEventListener('storage.accounts', onAccountsChanged)
      return () => window.removeEventListener('storage.accounts', onAccountsChanged)
    }, [])
  
    return { accounts, selectedAcc, onSelectAcc, onAddAccount, onRemoveAccount }
  }