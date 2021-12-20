import { useCallback, useEffect, useState, useMemo } from 'react';
import { BigNumber, getDefaultProvider, Contract } from 'ethers'
import networks from '../consts/networks'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'

const stakingTokens = [
    { token: 'ADX-STAKING', address: '0xB6456b57f03352bE48Bf101B46c1752a0813491a' },
    { token: 'ADX-LOYALTY', address: '0xd9A4cB9dc9296e111c66dFACAb8Be034EE2E1c2C' }]

export default function useSignerStaking({ currentNetwork, accounts, selectedAcc }) {

    const account = accounts.find(({ id }) => id === selectedAcc)

    const networkRpc = networks.find(({ id }) => id === 'ethereum').rpc
    const { signer } = account || {}

    const [balances, setBalances] = useState([])
    const [hasStaking, setHasStaking] = useState(false)
    
    const provider = useMemo(() => getDefaultProvider(networkRpc), [networkRpc])
    const contracts = useMemo(() => (stakingTokens.map(({ address }) => new Contract(address, ERC20ABI, provider))), [provider])

    const getStakingBalances = useCallback(async () => {
        if(!signer || !provider) return
        const balances = await Promise.all(contracts.map(async  (x, i) => (({...(stakingTokens[i]), balance: await x.balanceOf(signer.address)}))))

        setBalances(balances)
        setHasStaking(balances.some(x => x.balance.gt(BigNumber.from(0))))
    }, [contracts, provider, signer])

    useEffect(() => {
        getStakingBalances()
    }, [getStakingBalances, provider, signer])


    return {
        balances,
        hasStaking
    }
}