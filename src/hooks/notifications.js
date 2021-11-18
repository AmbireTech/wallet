import { useEffect } from 'react'
import { getTransactionSummary } from '../lib/humanReadableTransactions'
import { ethers } from 'ethers'
import { useToasts } from './toasts'
import networks from '../consts/networks'

const REQUEST_TITLE_PREFIX = 'Ambire Wallet: '
const SUPPORTED_TYPES =  ['eth_sendTransaction', 'personal_sign']
let currentNotifs = []
let isLastTotalBalanceInit = false
let lastTokensBalanceRaw = []

export default function useNotifications (requests, portfolio, selectedAcc) {
    const { addToast } = useToasts()

    useEffect(() => {
        if (window.Notification && Notification.permission !== 'denied') {
            Notification.requestPermission(() => {
                // @TODO: perhaps warn the user in some way
            })
        }
    }, [])
    
    const showNotification = ({ id, title, body, requireInteraction }) => {
        const notification = new Notification(title, {
            requireInteraction: requireInteraction || false,
            body,
            icon: 'public/logo192.png',
        })
        //notification.onclose = 
        notification.onclick = () => {
            window.focus()
            notification.close()
        }
        currentNotifs.push({ id, notification })
    }

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
        const body = isSign ? 'Click to preview' : getTransactionSummary([request.txn.to, request.txn.value, request.txn.data], request.chainId, request.account)
        showNotification({
            id: request.id,
            title,
            body,
            requireInteraction: true
        })
    })

    useEffect(() => {
        try {
            if (!portfolio.isBalanceLoading && portfolio.balance) {
                if (!isLastTotalBalanceInit) {
                    isLastTotalBalanceInit = true
                    lastTokensBalanceRaw = portfolio.tokens.map(({ address, balanceRaw }) => ({ address, balanceRaw }))
                }

                const changedAmounts = portfolio.tokens.filter(({ address, balanceRaw }) => {
                    const lastToken = lastTokensBalanceRaw.find(token => token.address === address)
                    return lastToken && balanceRaw > lastToken.balanceRaw ? true : false 
                })

                changedAmounts.forEach(({ address, symbol, decimals, balanceRaw }) => {
                    const lastToken = lastTokensBalanceRaw.find(token => token.address === address)
                    const amountRecieved = ethers.utils.formatUnits((balanceRaw - lastToken.balanceRaw).toString(), decimals)

                    showNotification({
                        id: `received_amount_${Date.now()}`,
                        title: `${amountRecieved} ${symbol} Received.`,
                        body: `Your ${symbol} balance increased by ${amountRecieved} ${symbol}`
                    })

                    lastTokensBalanceRaw = [
                        ...lastTokensBalanceRaw.filter(token => token.address !== address),
                        {
                            ...lastToken,
                            balanceRaw
                        }
                    ]
                })
            }
        } catch(e) {
            console.error(e);
            addToast(e.message | e, { error: true })
        }
    }, [portfolio, addToast])

    useEffect(() => {
        isLastTotalBalanceInit = false
        lastTokensBalanceRaw = []
    }, [selectedAcc])

    currentNotifs = currentNotifs.filter(({ id, notification }) => {
        if (!requests.find(r => r.id === id)) {
            notification.close()
            return false
        }
        return true
    })
  }
  