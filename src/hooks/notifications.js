import { useEffect } from 'react'
import { getTransactionSummary } from '../lib/humanReadableTransactions'
import networks from '../consts/networks'

const REQUEST_TITLE_PREFIX = 'Ambire Wallet: '
const SUPPORTED_TYPES =  ['eth_sendTransaction', 'personal_sign']
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
        if (!SUPPORTED_TYPES.includes(request.type)) return
        if (currentNotifs.find(n => n.id === request.id)) return
        // @TODO: other request types, eg signature
        if (!request.txn) return
        const isSign = request.type === 'personal_sign'
        const network = networks.find(x => x.chainId === request.chainId)
        const title = REQUEST_TITLE_PREFIX+(
            isSign
                ? 'you have a new message to sign'
                : `new transaction request on ${network ? network.name : 'unknown network'}`
        )
        const notification = new Notification(title, {
            requireInteraction: true,
            body: isSign ? 'Click to preview' : getTransactionSummary([request.txn.to, request.txn.value, request.txn.data], request.chainId, request.account),
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
  