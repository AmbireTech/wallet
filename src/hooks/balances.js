import { useEffect, useState } from 'react';
import { supportedBalances, getBalances } from '../services/zapper';

const ZAPPER_API_KEY = '5d1237c2-3840-4733-8e92-c5a58fe81b88';

export default function useBalances({ currentNetwork, account }) {
    const [balances, setBalance] = useState([]);

    const updateBalances = (currentNetwork, address) => {
        supportedBalances(ZAPPER_API_KEY).then(supported => {
            const { apps } = supported.find(({ network }) => network === currentNetwork);
            apps.map(({ appId }) => getBalances(ZAPPER_API_KEY, currentNetwork, appId, address).then(balance => {
                setBalance(balances => [
                    ...balances,
                    {
                        appId,
                        ...Object.values(balance)[0]
                    }
                ]);
            }));
        });
    };

    useEffect(() => {
        updateBalances(currentNetwork, account);
    }, [currentNetwork, account]);

    return {
        balances
    }
}