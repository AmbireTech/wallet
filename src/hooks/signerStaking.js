import { useCallback, useEffect, useState, useMemo } from 'react';
import { BigNumber, getDefaultProvider, Contract } from 'ethers'
import networks from '../consts/networks'
import stakingTokens from '../consts/stakingTokens'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'


export default function useSignerStaking({ currentNetwork, accounts, selectedAcc }) {

    const account = accounts.find(({ id }) => id === selectedAcc)

    const networkRpc = networks.find(({ id }) => id === 'ethereum').rpc
    const { signer } = account || {}

    const [balances, setBalances] = useState([])
    const [hasStaking, setHasStaking] = useState(false)
    const provider = useMemo(() => getDefaultProvider(networkRpc), [networkRpc])
    const contracts = useMemo(() => (stakingTokens.map(({ address }) => new Contract(address, ERC20ABI, provider))), [provider])

    const getStakingBalances = useCallback(async () => {
        if (!signer || !provider) return
        const balances = (await Promise.all(
            contracts.map(async (x, i) =>
                (({ ...(stakingTokens[i]), balance: await x.balanceOf(signer.address) }))
            )))
            .filter(x => x.balance.gt(BigNumber.from(0)))

        setBalances(balances)
        setHasStaking(!!balances.length)
    }, [contracts, provider, signer])

    useEffect(() => {
        getStakingBalances()
    }, [getStakingBalances, provider, signer])


    return {
        balances,
        hasStaking
    }
}