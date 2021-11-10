import { useCallback, useEffect, useState } from 'react';

import { ZAPPER_API_KEY } from '../config';
import { fetchGet } from '../lib/fetch';
import { ZAPPER_API_ENDPOINT } from '../config'
import suportedProtocols from '../consts/supportedProtocols';

const getBalances = (apiKey, network, protocol, address) => fetchGet(`${ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

let tokensByNetworks = []
let balanceByNetworks = []
let otherProtocolsByNetworks = []
let lastOtherProcolsRefresh = null

export default function usePortfolio({ currentNetwork, account, onError }) {
    const [isBalanceLoading, setBalanceLoading] = useState(true);
    const [areAssetsLoading, setAssetsLoading] = useState(true);
    const [balance, setBalance] = useState({
        total: {
            full: 0,
            truncated: 0,
            decimals: '00'
        },
        tokens: []
    });
    const [otherBalances, setOtherBalances] = useState([]);
    const [assets, setAssets] = useState([]);

    const updateStates = (currentNetwork) => {
        const balance = balanceByNetworks.find(({ network }) => network === currentNetwork)
        if (balance) {
            setBalance(balance)
            setOtherBalances(balanceByNetworks.filter(({ network }) => network !== currentNetwork))
        }

        const tokens = tokensByNetworks.find(({ network }) => network === currentNetwork)
        const otherProtocols = otherProtocolsByNetworks.find(({ network }) => network === currentNetwork)
        if (tokens && otherProtocols) {
            setAssets([
                ...tokens.products,
                ...otherProtocols.protocols
            ])
        }
    }

    const fetchBalances = async (account) => {
        try {
            let failedRequests = 0
            const requestsCount = suportedProtocols.length

            tokensByNetworks = (await Promise.all(suportedProtocols.map(async ({ network }) => {
                try {
                    const balance = await getBalances(ZAPPER_API_KEY, network, 'tokens', account)
                    if (!balance) return null

                    const { meta, products } = Object.values(balance)[0]
                    return meta.length && products.length ? {
                        network,
                        meta,
                        products
                    } : null
                } catch(_) {
                    failedRequests++
                }
            }))).filter(data => data)

            if (failedRequests >= requestsCount) throw new Error('Failed to fetch Tokens from Zapper API')

            balanceByNetworks = tokensByNetworks.map(({ network, meta, products }) => {
                const balanceUSD = meta.find(({ label }) => label === 'Total').value + meta.find(({ label }) => label === 'Debt').value
                const [truncated, decimals] = Number(balanceUSD.toString()).toFixed(2).split('.')
                return {
                    network,
                    total: {
                        full: balanceUSD,
                        truncated: Number(truncated).toLocaleString('en-US'),
                        decimals
                    },
                    tokens: products.map(({ assets }) => assets.map(({ tokens }) => tokens)).flat(2)
                }
            })

            return true
        } catch (error) {
            onError(error)
            return false
        }
    }

    const fetchOtherProtocols = async (account) => {
        try {
            let failedRequests = 0
            const requestsCount = suportedProtocols.reduce((acc, curr) => curr.protocols.length + acc, 0)

            otherProtocolsByNetworks = (await Promise.all(suportedProtocols.map(async ({ network, protocols }) => {
                const all = (await Promise.all(protocols.map(async protocol => {
                    try {
                        const balance = await getBalances(ZAPPER_API_KEY, network, protocol, account)
                        return balance ? Object.values(balance)[0] : null
                    } catch(_) {
                        failedRequests++
                    }
                }))).filter(data => data).flat()

                return all.length ? {
                    network,
                    protocols: all.map(({ products }) => products).flat(2)
                } : null
            }))).filter(data => data)
            
            lastOtherProcolsRefresh = Date.now()

            if (failedRequests >= requestsCount) throw new Error('Failed to fetch other Protocols from Zapper API')
            return true
        } catch (error) {
            onError(error)
            return false
        }
    }

    const refreshBalanceIfFocused = useCallback(() => {
        if (document.hasFocus() && !isBalanceLoading) fetchBalances(account)
    }, [isBalanceLoading, account])

    const requestOtherProtocolsRefresh = async () => {
        if ((Date.now() - lastOtherProcolsRefresh) > 30000 && !areAssetsLoading) await fetchOtherProtocols(account)
    }

    // Fetch balances and protocols on account change
    useEffect(() => {
        tokensByNetworks = []
        balanceByNetworks = []
        otherProtocolsByNetworks = []

        async function loadBalance() {
            setBalanceLoading(true)
            if (await fetchBalances(account)) setBalanceLoading(false)
        }
        
        async function loadProtocols() {
            setAssetsLoading(true)
            if (await fetchOtherProtocols(account)) setAssetsLoading(false)
        }

        loadBalance()
        loadProtocols()
    }, [account])

    // Update states on network change
    useEffect(() => updateStates(currentNetwork), [isBalanceLoading, areAssetsLoading, currentNetwork])

    // Refresh balance periodically
    useEffect(() => {
        const refreshInterval = setInterval(refreshBalanceIfFocused, 30000)
        return () => clearInterval(refreshInterval)
    }, [refreshBalanceIfFocused])

    // Refresh balance when window is focused
    useEffect(() => {
        window.addEventListener('focus', refreshBalanceIfFocused)
        return () => window.removeEventListener('focus', refreshBalanceIfFocused)
    }, [refreshBalanceIfFocused])

    return {
        isBalanceLoading,
        areAssetsLoading,
        balance,
        otherBalances,
        assets,
        requestOtherProtocolsRefresh
    }
}