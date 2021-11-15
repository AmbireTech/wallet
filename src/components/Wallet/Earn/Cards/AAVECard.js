import { ethers, getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useState } from 'react'
import AAVELendingPoolAbi from '../../../../consts/AAVELendingPoolAbi'

import AAVE_ICON from '../../../../resources/aave.svg'
import Card from './Card/Card'

const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const lendingPoolProvider = {
    ethereum: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
    polygon: '0xd05e3E715d945B59290df0ae8eF85c1BdB684744'
}
const RAY = 10**27

const AAVECard = ({ network, tokens }) => {
    const [details, setDetails] = useState([])

    const { rpc } = network
    const provider = getDefaultProvider(rpc)
    const lendingPoolProviderContract = new ethers.Contract(lendingPoolProvider[network.id], AAVELendingPool, provider)

    const updateDetails = async (tokenAddress) => {
        const lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()
        const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)

        const data = await lendingPoolContract.getReserveData(tokenAddress)
        const { liquidityRate } = data
        const depositAPR = ((liquidityRate / RAY) * 100).toFixed(2)

        setDetails([
            ['Annual Percentage Rate (APR)', `${depositAPR}%`],
            ['Lock', 'No Lock'],
            ['TYPE', 'Variable Rate'],
        ])
    }

    const onTokenSelect = value => {
        const token = tokens.find(token => token.value === value)
        if (token) updateDetails(token.value)
    }

    return (
        <Card icon={AAVE_ICON} details={details} tokens={tokens} onTokenSelect={onTokenSelect}/>
    )
}

export default AAVECard