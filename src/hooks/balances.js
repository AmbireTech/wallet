import { useEffect, useState } from 'react';
import { supportedBalances, getBalances } from '../services/zapper';

import { ZAPPER_API_KEY } from '../config';

export default function useBalances({ currentNetwork, account }) {
    const [balances, setBalance] = useState([]);

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

    return {
        balances
    }
}