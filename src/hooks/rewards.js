import { useEffect, useState, useCallback } from "react"
import { useToasts } from "./toasts"

const useRewards = ({ relayerURL, account }) => {
    const { addToast } = useToasts()

    const [balanceRewards, setBalanceRewards] = useState(0)
    const [adxRewards, setAdxRewards] = useState(0)

    const resetRewards = () => {
        setBalanceRewards(0)
    }

    const getRewards = useCallback(async () => {
        try {
            const response = await fetch(`${relayerURL}/wallet-token/rewards/${account}`)
            const body = await response.json()
            if (!body || !body.success) return resetRewards()
            
            const { rewards } = body
            if (!rewards.length) return resetRewards()

            rewards.forEach(({ _id, rewards }) => {
                const entry = Object.entries(rewards).find(([address]) => address === account)
                const value = (entry && entry[1]) || 0
                if (_id === 'balance-rewards') setBalanceRewards(value)
                if (_id === 'adx-rewards') setAdxRewards(value)
            })
        } catch(e) {
            console.error(e);
            addToast('Could not fetch rewards.', { error: true })
        }
    }, [relayerURL, account, addToast])

    useEffect(() => getRewards(), [getRewards, account])

    return {
        balanceRewards,
        adxRewards
    }
}

export default useRewards