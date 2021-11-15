import { ethers, getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { useToasts } from '../../../../hooks/toasts'
import AAVELendingPoolAbi from '../../../../consts/AAVELendingPoolAbi'

import AAVE_ICON from '../../../../resources/aave.svg'
import Card from './Card/Card'

const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const lendingPoolProvider = {
    ethereum: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
    polygon: '0xd05e3E715d945B59290df0ae8eF85c1BdB684744',
    avalanche: '0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f'
}
const RAY = 10**27

const AAVECard = ({ network, tokens }) => {
    const { addToast } = useToasts()

    const [tokenItems, setTokenItems] = useState([])
    const [details, setDetails] = useState([])

    const initPool = useCallback(async () => {
        try {
            const { rpc } = network
            const provider = getDefaultProvider(rpc)
            const lendingPoolProviderContract = new ethers.Contract(lendingPoolProvider[network.id], AAVELendingPool, provider)
            const lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()
        
            const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)
            const reserves = await lendingPoolContract.getReservesList()
            const availableTokens = tokens.filter(({ address }) => reserves.map(reserve => reserve.toLowerCase()).includes(address))
    
            const tokensWithApr = await Promise.all(availableTokens.map(async token => {
                const data = await lendingPoolContract.getReserveData(token.address)
                const { liquidityRate } = data
                return {
                    ...token,
                    apr: ((liquidityRate / RAY) * 100).toFixed(2)
                }
            }))

            const tokenItems = tokensWithApr.map(({ img, symbol, address, balance, apr }) => ({
                icon: img,
                label: `${symbol} (${apr}% APR)`,
                value: address,
                address,
                balance,
                symbol,
                apr
            }))

            setTokenItems(tokenItems)
        } catch(e) {
            console.error(e);
            addToast(e.message | e, { error: true })
        }
    }, [addToast, tokens, network])

    const onTokenSelect = useCallback(async (value) => {
        const token = tokenItems.find(({ address }) => address === value)
        if (token) {
            setDetails([
                ['Annual Percentage Rate (APR)', `${token.apr}%`],
                ['Lock', 'No Lock'],
                ['Type', 'Variable Rate'],
            ])
        }
    }, [tokenItems])

    useEffect(() => initPool(), [tokens, initPool])

    return (
        <Card icon={AAVE_ICON} details={details} tokens={tokenItems} onTokenSelect={onTokenSelect}/>
    )
}

export default AAVECard