import { useEffect } from 'react'
import { getTransactionSummary } from '../lib/humanReadableTransactions'

const REQUEST_TITLE = 'Ambire Wallet: new transaction request'
let currentNotifs = []

export default function useNotifications (requests) {
    useEffect(() => {
        if (window.Notification && Notification.permission !== 'denied') {
            Notification.requestPermission(() => {
                // @TODO: perhaps warn the user in some way
            })
        }
    }, [])

    requests.forEach(request => {
        if (currentNotifs.find(n => n.id === request.id)) return
        // @TODO: other request types, eg signature
        if (!request.txn) return
        // @TODO network name
        const notification = new Notification(REQUEST_TITLE, {
            requireInteraction: true,
            body: getTransactionSummary([request.txn.to, request.txn.value, request.txn.data], request.chainId),
            icon: 'public/logo192.png',
        })
        //notification.onclose = 
        notification.onclick = () => {
            window.focus()
            notification.close()
        }
        currentNotifs.push({ id: request.id, notification })
    })

    currentNotifs = currentNotifs.filter(({ id, notification }) => {
        if (!requests.find(r => r.id === id)) {
            notification.close()
            return false
        }
        return true
    })
  }
  