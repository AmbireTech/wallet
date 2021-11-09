import { useCallback, useEffect, useState } from 'react';

import { ZAPPER_API_KEY } from '../config';
import { fetchGet } from '../lib/fetch';
import { ZAPPER_API_ENDPOINT } from '../config'
import suportedProtocols from '../consts/supportedProtocols';

const getBalances = (apiKey, network, protocol, address) => fetchGet(`${ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

let tokensByNetworks = {}
let balanceByNetworks = {}
let protocolsByNetworks = {}

export default function usePortfolio({ currentNetwork, account }) {
    const [isLoading, setLoading] = useState(true);
    const [balance, setBalance] = useState({
        total: {},
        tokens: []
    });
    const [otherBalances, setOtherBalances] = useState([]);
    const [assets, setAssets] = useState([]);

    const updateBalances = async (account) => {
        tokensByNetworks = Object.fromEntries(await Promise.all(Object.values(suportedProtocols).map(async ({ network }) => [
            network,
            Object.values(await getBalances(ZAPPER_API_KEY, network, 'tokens', account))[0]
        ])))

        balanceByNetworks = Object.fromEntries(Object.entries(tokensByNetworks).map(([network, { meta, products }]) => {
            const balanceUSD = meta.find(({ label }) => label === 'Total').value + meta.find(({ label }) => label === 'Debt').value
            const [truncated, decimals] = Number(balanceUSD.toString()).toFixed(2).split('.')

            return [network, {
                total: {
                    full: balanceUSD,
                    truncated,
                    decimals
                },
                tokens: products.map(({ assets }) => assets.map(({ tokens }) => tokens)).flat(2)
            }]
        }))
    }

    const updateProtocols = async (account) => {
        protocolsByNetworks = Object.fromEntries((await Promise.all(suportedProtocols.map(async ({ network, protocols }) => [
            network,
            await Promise.all(protocols.map(async protocol => {
                const balance = await getBalances(ZAPPER_API_KEY, network, protocol, account)
                const { products } = Object.values(balance)[0]
                return products
            }
        ))]))).map(([network, protocols]) => [network, protocols.flat(2)]))
    }

    const refreshIfFocused = useCallback(() => {
        if (document.hasFocus() && !isLoading) updateBalances(account)
    }, [isLoading, account])

    useEffect(() => {
        async function updateAll() {
            setLoading(true)
            await updateBalances(account)
            await updateProtocols(account)
            setLoading(false)
        }
        updateAll()
    }, [account])

    useEffect(() => {
        if (!isLoading) {
            setBalance(balanceByNetworks[currentNetwork])
            setOtherBalances(Object.fromEntries(Object.entries(balanceByNetworks).filter(([network]) => network !== currentNetwork)))
            setAssets([
                ...tokensByNetworks[currentNetwork].products,
                ...protocolsByNetworks[currentNetwork]
            ])
        }
    }, [isLoading, currentNetwork])

    // Refresh periodically
    useEffect(() => {
        const refreshInterval = setInterval(refreshIfFocused, 30000)
        return () => clearInterval(refreshInterval)
    }, [refreshIfFocused])

    // Refresh when window is focused
    useEffect(() => {
        window.addEventListener('focus', refreshIfFocused)
        return () => window.removeEventListener('focus', refreshIfFocused)
    }, [refreshIfFocused])

    return {
        isLoading,
        balance,
        otherBalances,
        assets
    }
}