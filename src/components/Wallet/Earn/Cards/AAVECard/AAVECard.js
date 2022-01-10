import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToasts } from '../../../../../hooks/toasts'
import AAVELendingPoolAbi from '../../../../../consts/AAVELendingPoolAbi'
import AAVELendingPoolProviders from '../../../../../consts/AAVELendingPoolProviders'
import networks from '../../../../../consts/networks'
import { getProvider } from '../../../../../lib/provider'

import AAVE_ICON from '../../../../../resources/aave.svg'
import Card from '../Card/Card'
import { getDefaultTokensItems } from './defaultTokens'
import approveToken from '../../../../../lib/approveToken'

const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const RAY = 10**27
let lendingPoolAddress = null

const AAVECard = ({ networkId, tokens, protocols, account, addRequest }) => {
    const { addToast } = useToasts()

    const currentNetwork = useRef()
    const [isLoading, setLoading] = useState(true)
    const [unavailable, setUnavailable] = useState(false)
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

    const networkDetails = networks.find(({ id }) => id === networkId)
    const defaultTokens = useMemo(() => getDefaultTokensItems(networkDetails.id), [networkDetails.id])
    const getToken = (type, address) => tokensItems.filter(token => token.type === type).find(token => token.address === address)
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account, txn, extraGas })

    const onValidate = async (type, tokenAddress, amount) => {
        if (type === 'Deposit') {
            const token = getToken('deposit', tokenAddress)
            const bigNumberHexAmount = ethers.utils.parseUnits(amount.toString(), token.decimals).toHexString()
            await approveToken('Aave Pool', networkDetails.id, account, lendingPoolAddress, tokenAddress, addRequestTxn, addToast)

            try {
                addRequestTxn(`aave_pool_deposit_${Date.now()}`, {
                    to: lendingPoolAddress,
                    value: '0x0',
                    data: AAVELendingPool.encodeFunctionData('deposit', [tokenAddress, bigNumberHexAmount, account, 0])
                }, 60000)
            } catch(e) {
                console.error(e)
                addToast(`Aave Deposit Error: ${e.message || e}`, { error: true })
            }
        }
        else if (type === 'Withdraw') {
            const token = getToken('withdraw', tokenAddress)
            const bigNumberHexAmount = ethers.utils.parseUnits(amount.toString(), token.decimals).toHexString()
            await approveToken('Aave Pool', networkDetails.id, account, lendingPoolAddress, tokenAddress, addRequestTxn, addToast)

            try {
                addRequestTxn(`aave_pool_withdraw_${Date.now()}`, {
                    to: lendingPoolAddress,
                    value: '0x0',
                    data: AAVELendingPool.encodeFunctionData('withdraw', [tokenAddress, bigNumberHexAmount, account])
                }, 60000)
            } catch(e) {
                console.error(e)
                addToast(`Aave Withdraw Error: ${e.message || e}`, { error: true })
            }
        }
    }

    const loadPool = useCallback(async () => {
        const providerAddress = AAVELendingPoolProviders[networkDetails.id]
        if (!providerAddress) {
            setLoading(false)
            setUnavailable(true)
            return
        }

        try {
            const provider = getProvider(networkDetails.id)
            const lendingPoolProviderContract = new ethers.Contract(providerAddress, AAVELendingPool, provider)
            lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()
        
            const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)
            const reserves = await lendingPoolContract.getReservesList()
            const reservesAddresses = reserves.map(reserve => reserve.toLowerCase())

            const withdrawTokens = (protocols.find(({ label }) => label === 'Aave V2')?.assets || [])
                .map(({ symbol, tokens }) => tokens && tokens.map(token => ({
                    ...token,
                    symbol,
                    type: 'withdraw'
                })))
                .flat(1)
                .filter(token => token)

            const depositTokens = tokens.filter(({ address }) => reservesAddresses.includes(address)).map(token => ({
                ...token,
                type: 'deposit'
            })).filter(token => token)

            const allTokens = (await Promise.all([
                ...defaultTokens.filter(({ type, address }) => type === 'deposit' && !depositTokens.map(({ address }) => address).includes(address)),
                ...defaultTokens.filter(({ type, address }) => type === 'withdraw' && !withdrawTokens.map(({ address }) => address).includes(address)),
                ...withdrawTokens,
                ...depositTokens
            ]))
            
            const uniqueTokenAddresses = [...new Set(allTokens.map(({ address }) => address))]
            const tokensAPR = Object.fromEntries(await Promise.all(uniqueTokenAddresses.map(async address => {
                const data = await lendingPoolContract.getReserveData(address)
                const { liquidityRate } = data
                const apr = ((liquidityRate / RAY) * 100).toFixed(2)
                return [address, apr]
            })))

            const tokensItems = allTokens.map(token => ({
                ...token,
                apr: tokensAPR[token.address],
                icon: token.img || token.tokenImageUrl,
                label: `${token.symbol} (${tokensAPR[token.address]}% APR)`,
                value: token.address
            }))

            // Prevent race conditions
            if (currentNetwork.current !== networkDetails.id) return

            setTokensItems(tokensItems)
            setLoading(false)
            setUnavailable(false)
        } catch(e) {
            console.error(e);
            addToast(`Aave load pool error: ${e.message || e}`, { error: true })
        }
    }, [addToast, protocols, tokens, defaultTokens, networkDetails])

    useEffect(() => loadPool(), [loadPool])
    useEffect(() => {
        currentNetwork.current = networkId
        setLoading(true)
    }, [networkId])

    return (
        <Card loading={isLoading} unavailable={unavailable} icon={AAVE_ICON} details={details} tokensItems={tokensItems} onTokenSelect={onTokenSelect} onValidate={onValidate}/>
    )
}

export default AAVECard
