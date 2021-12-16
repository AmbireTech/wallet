import { useEffect, useState } from "react"
import { useToasts } from "./toasts"
import { useRelayerData } from "./"

const useRewards = ({ relayerURL, account }) => {
    const { addToast } = useToasts()

    const url = relayerURL ? `${relayerURL}/wallet-token/rewards/${account}` : null
    const { data, errMsg, isLoading } = useRelayerData(url)

    const [balanceRewards, setBalanceRewards] = useState(0)
    const [adxRewards, setAdxRewards] = useState(0)
    const [total, setTotal] = useState(0)

    const resetRewards = () => {
        setBalanceRewards(0)
        setAdxRewards(0)
    }

    useEffect(() => {
        try {
            if (errMsg) throw new Error(errMsg)
            if (!data || !data.success) return resetRewards()

            const { rewards } = data
            if (!rewards.length) return resetRewards()

            rewards.forEach(({ _id, rewards }) => {
                const entry = Object.entries(rewards).find(([address]) => address === account)
                const value = (entry && entry[1]) || 0
                if (_id === 'balance-rewards') setBalanceRewards(value)
                if (_id === 'adx-rewards') setAdxRewards(value)
            })
        } catch(e) {
            console.error(e);
            addToast('Rewards: ' + e.message || e, { error: true })
        }
    }, [data, errMsg, account, addToast])

    useEffect(() => {
        const total = balanceRewards + adxRewards
        setTotal(total)
    }, [balanceRewards, adxRewards])

    return {
        isLoading,
        balanceRewards,
        adxRewards,
        total
    }
}

export default useRewards