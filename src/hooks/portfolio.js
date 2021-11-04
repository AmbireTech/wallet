import { useEffect, useState } from 'react';
import { supportedBalances, getBalances } from '../services/zapper';

import { ZAPPER_API_KEY } from '../config';

export default function usePortfolio({ currentNetwork, account }) {
    const [isLoading, setLoading] = useState(true);
    const [balances, setBalance] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [totalUSD, setTotalUSD] = useState({
        full: 0,
        formated: null,
        decimals: null
    });

    const updateBalances = async (currentNetwork, address) => {
        setLoading(true);

        const supBalances = await supportedBalances(ZAPPER_API_KEY)
        const { apps } = supBalances.find(({ network }) => network === currentNetwork);
        
        const balances = await Promise.all(apps.map(async ({appId}) => {
            let balance = await getBalances(ZAPPER_API_KEY, currentNetwork, appId, address);
            
            return {
                appId,
                ...Object.values(balance)[0]
            }
        }));

        const total = Number(
            balances
                .filter(({ meta }) => meta && meta.length)
                .map(({ meta }) => meta.find(({ label }) => label === 'Total').value)
                .reduce((acc, curr) => acc + curr, 0)
                .toFixed(2)
        );

        const [truncated, decimals] = total.toString().split('.');
        const formated = Number(truncated).toLocaleString('en-US');

        const tokens = balances
            .find(({ appId }) => appId === 'tokens')
            .products.map(({ assets }) => assets.map(({ tokens }) => tokens))
            .flat(2);

        setBalance(balances);
        setTotalUSD({
            full: total,
            formated,
            decimals: decimals ? decimals : '00'
        });
        setTokens(tokens);
        setLoading(false);
    }

    useEffect(() => {
        updateBalances(currentNetwork, account);
    }, [currentNetwork, account]);

    return {
        balances,
        totalUSD,
        tokens,
        isLoading
    }
}