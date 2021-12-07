import { useCallback, useRef, useEffect } from 'react'
import { getTransactionSummary } from '../lib/humanReadableTransactions'
import { ethers } from 'ethers'
import { useToasts } from './toasts'
import networks from '../consts/networks'

const REQUEST_TITLE_PREFIX = 'Ambire Wallet: '
const SUPPORTED_TYPES =  ['eth_sendTransaction', 'personal_sign']
const BALANCE_TRESHOLD = 1.00001
let currentNotifs = []
let isLastTotalBalanceInit = false
let lastTokensBalanceRaw = []

const getAmountReceived = (lastToken, newBalanceRaw, decimals) => {
    const amountRecieved = lastToken ? newBalanceRaw - lastToken.balanceRaw : newBalanceRaw
    return ethers.utils.formatUnits(amountRecieved.toString(), decimals)
}

const getTransactionStatus = async (rpc, txHash) => {
    try {
        const response = await fetch(rpc, {
            method: 'POST',
            headers: {
                'ContentType': 'application/json'
            },
            body: JSON.stringify({
                jsonrpc: "2.0",
                method: "eth_getTransactionByHash",
                params: [txHash],
                id: 1
            })
        })

        const { result } = await response.json()
        return result
    } catch(e) {
        console.error(e);
        return null
    }
}

export default function useNotifications (requests, onShow, portfolio, selectedAcc, network, sentTxn, confirmSentTx) {
    const { addToast } = useToasts()
    const onShowRef = useRef({})
    onShowRef.current.onShow = onShow

    useEffect(() => {
        // hack because for whatever reason it doesn't work when we access the ref directly
        window.onClickNotif = req => onShowRef.current.onShow(req)
    }, [])
    
    const showNotification = useCallback(({ id, title, body, requireInteraction, request }) => {
        const notification = new Notification(title, {
            requireInteraction: requireInteraction || false,
            body,
            icon: 'public/logo192.png',
        })
        //notification.onclose = 
        notification.onclick = () => {
            if (request && request.type === 'eth_sendTransaction') window.onClickNotif(request)
            window.focus()
            notification.close()
        }
        currentNotifs.push({ id, notification })
    }, [])

    requests.forEach(request => {
        // only requests we actually want a notification for
        if (!request.notification) return
        if (!SUPPORTED_TYPES.includes(request.type)) return
        if (currentNotifs.find(n => n.id === request.id)) return
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
            request,
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
                    const isSignificantChange = lastToken && ((balanceRaw / lastToken.balanceRaw) > BALANCE_TRESHOLD)
                    return !lastToken || isSignificantChange
                })

                changedAmounts.forEach(({ address, symbol, decimals, balanceRaw }) => {
                    const lastToken = lastTokensBalanceRaw.find(token => token.address === address)
                    const amountRecieved = getAmountReceived(lastToken, balanceRaw, decimals)

                    showNotification({
                        id: `received_amount_${Date.now()}`,
                        title: `${amountRecieved} ${symbol} Received.`,
                        body: `Your ${symbol} balance increased by ${amountRecieved} ${symbol}`
                    })

                    lastToken ? lastTokensBalanceRaw = [
                        ...lastTokensBalanceRaw.filter(token => token.address !== address),
                        { address, balanceRaw }
                    ] : lastTokensBalanceRaw.push({ address, balanceRaw })
                })
            }
        } catch(e) {
            console.error(e)
            addToast(e.message | e, { error: true })
        }
    }, [portfolio, addToast, showNotification])

    useEffect(() => {
        const interval = network.id === 'ethereum' ? 30000 : 10000
        const txStatusInterval = setInterval(() => {
            sentTxn
                .filter(({ confirmed }) => !confirmed)
                .forEach(async ({ hash }) => {
                    const tx = await getTransactionStatus(network.rpc, hash)
                    if (!tx) return

                    confirmSentTx(hash)
                    showNotification({
                        id: `confirmed_tx_${Date.now()}`,
                        title: `Transaction Confirmed`,
                        body: `Your transaction was successfully confirmed!`
                    })
                })
        }, interval)
        return () => clearInterval(txStatusInterval)
    }, [sentTxn, network])

    useEffect(() => {
        isLastTotalBalanceInit = false
        lastTokensBalanceRaw = []
    }, [selectedAcc, network])

    currentNotifs = currentNotifs.filter(({ id, notification }) => {
        if (!requests.find(r => r.id === id)) {
            notification.close()
            return false
        }
        return true
    })
  }
  
