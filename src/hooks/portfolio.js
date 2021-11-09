import { useCallback, useEffect, useState } from 'react';

import { ZAPPER_API_KEY } from '../config';
import { fetchGet } from '../lib/fetch';
import { ZAPPER_API_ENDPOINT } from '../config'
import suportedProtocols from '../consts/supportedProtocols';

const getBalances = (apiKey, network, protocol, address) => fetchGet(`${ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

let tokensByNetworks = {}
let balanceByNetworks = {}
let otherProtocolsByNetworks = {}
let lastOtherProcolsRefresh = null

export default function usePortfolio({ currentNetwork, account }) {
    const [isBalanceLoading, setBalanceLoading] = useState(true);
    const [areAssetsLoading, setAssetsLoading] = useState(true);
    const [balance, setBalance] = useState({
        total: {},
        tokens: []
    });
    const [otherBalances, setOtherBalances] = useState([]);
    const [assets, setAssets] = useState([]);

    const updateStates = (currentNetwork) => {
        if (balanceByNetworks[currentNetwork]) {
            setBalance(balanceByNetworks[currentNetwork])
            setOtherBalances(Object.fromEntries(Object.entries(balanceByNetworks).filter(([network]) => network !== currentNetwork)))
        }

        if (tokensByNetworks[currentNetwork] && otherProtocolsByNetworks[currentNetwork])
            setAssets([
                ...tokensByNetworks[currentNetwork].products,
                ...otherProtocolsByNetworks[currentNetwork]
            ])
    }

    const fetchBalances = async (account) => {
        tokensByNetworks = Object.fromEntries((await Promise.all(Object.values(suportedProtocols).map(async ({ network }) => {
            const balance = await getBalances(ZAPPER_API_KEY, network, 'tokens', account)
            return [
                network,
                balance ? Object.values(balance)[0] : null
            ]
        }))).filter(([, values]) => values))

        balanceByNetworks = Object.fromEntries(Object.entries(tokensByNetworks).map(([network, { meta, products }]) => {
            const balanceUSD = meta.find(({ label }) => label === 'Total').value + meta.find(({ label }) => label === 'Debt').value
            const [truncated, decimals] = Number(balanceUSD.toString()).toFixed(2).split('.')

            return [network, {
                total: {
                    full: balanceUSD,
                    truncated: Number(truncated).toLocaleString('en-US'),
                    decimals
                },
                tokens: products.map(({ assets }) => assets.map(({ tokens }) => tokens)).flat(2)
            }]
        }))
    }

    const fetchOtherProtocols = async (account) => {
        otherProtocolsByNetworks = Object.fromEntries((await Promise.all(suportedProtocols.map(async ({ network, protocols }) => [
            network,
            await Promise.all(protocols.map(async protocol => {
                const balance = await getBalances(ZAPPER_API_KEY, network, protocol, account)
                if (!balance) return []
                const { products } = Object.values(balance)[0]
                return products
            }
        ))]))).map(([network, protocols]) => [network, protocols.flat(2)]))
    }

    const refreshBalanceIfFocused = useCallback(() => {
        if (document.hasFocus() && !isBalanceLoading) fetchBalances(account)
    }, [isBalanceLoading, account])

    const requestOtherProtocolsRefresh = async () => {
        if ((Date.now() - lastOtherProcolsRefresh) > 30000) {
            await fetchOtherProtocols(account)
            lastOtherProcolsRefresh = Date.now()
        }
    }

    // Fetch balances and protocols on account change
    useEffect(() => {
        async function loadBalance() {
            setBalanceLoading(true)
            await fetchBalances(account)
            setBalanceLoading(false)
        }
        
        async function loadProtocols() {
            setAssetsLoading(true)
            await fetchOtherProtocols(account)
            setAssetsLoading(false)
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