import { ethers, getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
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

    const [tokenItems, setTokenItems] = useState(tokens.map(({ img, symbol, address, balance }) => ({
        icon: img,
        label: symbol,
        value: address,
        symbol,
        balance: balance.toFixed(2)
    })))
    const [token, setToken] = useState(tokenItems[0].value)
    const [details, setDetails] = useState([])

    const { rpc } = network
    const provider = getDefaultProvider(rpc)
    const lendingPoolProviderContract = new ethers.Contract(lendingPoolProvider[network.id], AAVELendingPool, provider)

    const updateDetails = async (tokenAddress) => {
        try {
            const lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()
            const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)

            const data = await lendingPoolContract.getReserveData(tokenAddress)
            const { liquidityRate } = data
            const depositAPR = ((liquidityRate / RAY) * 100).toFixed(2)

            setDetails([
                ['Annual Percentage Rate (APR)', `${depositAPR}%`],
                ['Lock', 'No Lock'],
                ['Type', 'Variable Rate'],
            ])

            const token = tokenItems.find(({ value }) => value === tokenAddress);
            
            setTokenItems([
                ...tokenItems.filter(({ value }) => value !== tokenAddress),
                {
                    ...token,
                    label: `${token.symbol} (${depositAPR}% APR)`
                }
            ])
        } catch(e) {
            console.error(e);
            addToast(e.message | e, { error: true })
        }
    }

    useEffect(() => {
        const selectedToken = tokenItems.find(({ value }) => value === token)
        if (selectedToken) updateDetails(selectedToken.value)
    }, [token])

    return (
        <Card icon={AAVE_ICON} details={details} tokens={tokenItems} onTokenSelect={(value) => setToken(value)}/>
    )
}

export default AAVECard