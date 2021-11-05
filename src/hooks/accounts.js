import { useState, useCallback } from 'react'
import { useToasts } from '../hooks/toasts'

export default function useAccounts () {
    const { addToast } = useToasts()
    const [accounts, setAccounts] = useState(() => {
      // @TODO catch parse failures and handle them
      try {
        return JSON.parse(localStorage.accounts || '[]')
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
    const onAddAccount = useCallback((acc, opts) => {
      if (!(acc.id && acc.signer)) throw new Error('account: internal err: missing ID or signer')

      const existingIdx = accounts
        .findIndex(x => x.id.toLowerCase() === acc.id.toLowerCase())
  
      if (existingIdx !== -1) addToast('Account already added')

      if (existingIdx === -1) accounts.push(acc)
      else accounts[existingIdx] = acc
  
      // need to make a copy, otherwise no rerender
      setAccounts([ ...accounts ])
  
      localStorage.accounts = JSON.stringify(accounts)
  
      if (opts.select) onSelectAcc(acc.id)
      if (Object.keys(accounts).length) {
        window.location.href = '/#/wallet'
      }
    }, [accounts])
    return { accounts, selectedAcc, onSelectAcc, onAddAccount }
  }