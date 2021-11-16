import { ethers, getDefaultProvider } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState } from 'react'
import { useToasts } from '../../../../hooks/toasts'
import ERC20Abi from 'adex-protocol-eth/abi/ERC20.json'
import AAVELendingPoolAbi from '../../../../consts/AAVELendingPoolAbi'

import AAVE_ICON from '../../../../resources/aave.svg'
import Card from './Card/Card'

const ERC20Interface = new Interface(ERC20Abi)
const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const lendingPoolProvider = {
    ethereum: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
    polygon: '0xd05e3E715d945B59290df0ae8eF85c1BdB684744',
    avalanche: '0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f'
}
const RAY = 10**27
let lendingPoolAddress = null

const AAVECard = ({ network, tokens, protocols, account, addRequest }) => {
    const { addToast } = useToasts()

    const [isLoading, setLoading] = useState(true)
    const [tokensItems, setTokensItems] = useState([])
    const [details, setDetails] = useState([])

    const onTokenSelect = useCallback(async (value) => {
        const token = tokensItems.find(({ address }) => address === value)
        if (token) {
            setDetails([
                ['Annual Percentage Rate (APR)', `${token.apr}%`],
                ['Lock', 'No Lock'],
                ['Type', 'Variable Rate'],
            ])
        }
    }, [tokensItems])

    const approveToken = async (tokenAddress, bigNumberHexAmount) => {
        const ZERO = ethers.BigNumber.from(0)
        const { rpc } = network
        const provider = getDefaultProvider(rpc)
        const tokenContract = new ethers.Contract(tokenAddress, ERC20Interface, provider)
        const allowance = await tokenContract.allowance(account, tokenAddress)

        if (allowance.lt(bigNumberHexAmount)) {
            if (allowance.gt(ZERO)) addRequest({
                id: `aave_pool_deposit_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: network.chainId,
                account,
                txn: {
                    to: lendingPoolAddress,
                    value: bigNumberHexAmount,
                    data: '0x'
                }
            })
            addRequest({
                id: `aave_pool_deposit_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: network.chainId,
                account,
                txn: {
                    to: tokenAddress,
                    value: '0x0',
                    data: ERC20Interface.encodeFunctionData('approve', [lendingPoolAddress, bigNumberHexAmount])
                }
            })
	    }
    }

    const onValidate = async (type, tokenAddress, amount) => {
        if (type === 'Deposit') {
            const token = tokensItems.filter(({ type }) => type === 'deposit').find(({ address }) => address === tokenAddress)
            const bigNumberHexAmount = ethers.utils.parseUnits(amount.toString(), token.decimals).toHexString()
            await approveToken(tokenAddress, bigNumberHexAmount)

            try {
                addRequest({
                    id: `aave_pool_deposit_${Date.now()}`,
                    type: 'eth_sendTransaction',
                    chainId: network.chainId,
                    account,
                    txn: {
                        to: lendingPoolAddress,
                        value: '0x0',
                        data: AAVELendingPool.encodeFunctionData('deposit', [tokenAddress, bigNumberHexAmount, account, 0])
                    },
                    extraGas: 60000
                })
            } catch(e) {
                console.error(e)
                addToast(`Error: ${e.message || e}`, { error: true })
            }
        }
        else if (type === 'Withdraw') {
            const token = tokensItems.filter(({ type }) => type === 'withdraw').find(({ address }) => address === tokenAddress)
            const bigNumberHexAmount = ethers.utils.parseUnits(amount.toString(), token.decimals).toHexString()
            await approveToken(tokenAddress, bigNumberHexAmount)

            try {
                addRequest({
                    id: `aave_pool_withdraw_${Date.now()}`,
                    type: 'eth_sendTransaction',
                    chainId: network.chainId,
                    account,
                    txn: {
                        to: lendingPoolAddress,
                        value: '0x0',
                        data: AAVELendingPool.encodeFunctionData('withdraw', [tokenAddress, bigNumberHexAmount, account])
                    },
                    extraGas: 60000
                })
            } catch(e) {
                console.error(e)
                addToast(`Error: ${e.message || e}`, { error: true })
            }
        }
    }

    useEffect(() => {
        const loadPool = async () => {
            try {
                const { rpc } = network
                const provider = getDefaultProvider(rpc)
                const lendingPoolProviderContract = new ethers.Contract(lendingPoolProvider[network.id], AAVELendingPool, provider)
                lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()
            
                const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)
                const reserves = await lendingPoolContract.getReservesList()
                const reservesAddresses = reserves.map(reserve => reserve.toLowerCase())

                const withdrawTokens = (protocols.find(({ label }) => label === 'Aave V2')?.assets || [])
                    .map(({ tokens }) => tokens.map(({ img, symbol, tokens }) => tokens.map(token => ({
                        ...token,
                        img,
                        symbol,
                        type: 'withdraw'
                    }))))
                    .flat(2)

                const depositTokens = tokens.filter(({ address }) => reservesAddresses.includes(address)).map(token => ({
                    ...token,
                    type: 'deposit'
                }))

                const tokensItems = (await Promise.all([
                    ...withdrawTokens,
                    ...depositTokens
                ].map(async token => {
                    const data = await lendingPoolContract.getReserveData(token.address)
                    const { liquidityRate } = data
                    return {
                        ...token,
                        apr: ((liquidityRate / RAY) * 100).toFixed(2)
                    }
                })))
                .map(({ type, img, symbol, address, balance, decimals, apr }) => ({
                    icon: img,
                    label: `${symbol} (${apr}% APR)`,
                    value: address,
                    type,
                    address,
                    balance,
                    symbol,
                    decimals,
                    apr
                }))

                setTokensItems(tokensItems)
                setLoading(false)
            } catch(e) {
                console.error(e);
                addToast(e.message | e, { error: true })
            }
        }

        loadPool()
    }, [addToast, tokens, protocols, network])

    return (
        <Card loading={isLoading} icon={AAVE_ICON} details={details} tokensItems={tokensItems} onTokenSelect={onTokenSelect} onValidate={onValidate}/>
    )
}

export default AAVECard