import { useCallback, useEffect, useState } from 'react';

import { ZAPPER_API_KEY } from '../config';
import { fetchGet } from '../lib/fetch';
import { ZAPPER_API_ENDPOINT } from '../config'

const supportedBalances = (apiKey) => fetchGet(`${ZAPPER_API_ENDPOINT}/protocols/balances/supported?api_key=${apiKey}`)
const getBalances = (apiKey, network, protocol, address) => fetchGet(`${ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

export default function usePortfolio({ currentNetwork, account }) {
    const [isLoading, setLoading] = useState(true);
    const [isRefreshing, setRefreshing] = useState(false);
    const [balances, setBalance] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [assets, setAssets] = useState([]);
    const [totalUSD, setTotalUSD] = useState({
        full: 0,
        formated: null,
        decimals: null
    });

    const updatePortfolio = async (currentNetwork, address, refresh) => {
        if (!address) return

        refresh ? setRefreshing(true) : setLoading(true)

        const supBalances = await supportedBalances(ZAPPER_API_KEY)
        const { apps } = supBalances.find(({ network }) => network === currentNetwork);
        
        const balances = await Promise.all(apps.map(async ({appId}) => {
            const balance = await getBalances(ZAPPER_API_KEY, currentNetwork, appId, address);
            return balance ? {
                appId,
                ...Object.values(balance)[0]
            } : {}
        }));

        const total = balances
            .filter(({ meta }) => meta && meta.length)
            .map(({ meta }) => meta.find(({ label }) => label === 'Total').value + meta.find(({ label }) => label === 'Debt').value)
            .reduce((acc, curr) => acc + curr, 0)
            .toFixed(2)

        const [truncated, decimals] = total.toString().split('.');
        const formated = Number(truncated).toLocaleString('en-US');

        const tokens = balances
            .find(({ appId }) => appId === 'tokens')
            ?.products.map(({ assets }) => assets.map(({ tokens }) => tokens))
            .flat(2);

        const assets = balances
            .filter(({ products }) => products && products.length)
            .map(({ products }) => products.map(({ label, assets }) => ({ label, assets })))
            .flat(1)
            .sort((a, b) => {
                if (a.label < b.label) return -1
                if (a.label > b.label) return 1
                return 0
            })

        setBalance(balances);
        setTotalUSD({
            full: total,
            formated,
            decimals: decimals ? decimals : '00'
        });
        setTokens(tokens);
        setAssets(assets);

        refresh ? setRefreshing(false) : setLoading(false)
    }

    const refreshIfFocused = useCallback(() => {
        if (document.hasFocus() && !isLoading && !isRefreshing) {
            updatePortfolio(currentNetwork, account, true)
        }
    }, [isLoading, isRefreshing, currentNetwork, account])

    // Update portfolio when currentNetwork or account are updated
    useEffect(() => {
        updatePortfolio(currentNetwork, account);
    }, [currentNetwork, account]);

    // Refresh periodically
    useEffect(() => {
        const refreshInterval = setInterval(refreshIfFocused, 60000)
        return () => clearInterval(refreshInterval)
    }, [currentNetwork, account, refreshIfFocused])

    // Refresh when window is focused
    useEffect(() => {
        window.addEventListener('focus', refreshIfFocused)
        return () => window.removeEventListener('focus', refreshIfFocused)
    }, [refreshIfFocused])

    return {
        balances,
        totalUSD,
        tokens,
        assets,
        isLoading
    }
}