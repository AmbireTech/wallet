import { useEffect, useState } from 'react';
import { supportedBalances, getBalances } from '../services/zapper';

import { ZAPPER_API_KEY } from '../config';

export default function useBalances({ currentNetwork, account }) {
    const [balances, setBalance] = useState([]);
    const [totalUSD, setTotalUSD] = useState({});

    const updateBalances = async (currentNetwork, address) => {
        const supBalances = await supportedBalances(ZAPPER_API_KEY)
        const { apps } = supBalances.find(({ network }) => network === currentNetwork);
        
        const balances = await Promise.all(apps.map(async ({appId}) => {
            let balance = await getBalances(ZAPPER_API_KEY, currentNetwork, appId, address);
            
            return {
                appId,
                ...Object.values(balance)[0]
            }
        }));

        setBalance(balances)
    }

    useEffect(() => {
        updateBalances(currentNetwork, account);
    }, [currentNetwork, account]);

    useEffect(() => {
        const total = balances
            .filter(({ meta }) => meta && meta.length)
            .map(({ meta }) => meta.find(({ label }) => label === 'Total').value)
            .reduce((acc, curr) => acc + curr, 0)
            .toFixed(2);

        const [truncated, decimal] = total.split('.');

        setTotalUSD({
            truncated,
            decimal
        });
    }, [balances]);

    return {
        balances,
        totalUSD
    }
}