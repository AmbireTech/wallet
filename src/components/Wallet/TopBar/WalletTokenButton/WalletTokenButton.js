import { useEffect, useState } from "react"
import { useModals } from "hooks";
import { Button, ToolTip } from "components/common";
import { WalletTokenModal } from "components/Modals";
import useClaimableWalletToken from "./useClaimableWalletToken";

const WalletTokenButton = ({ relayerURL, rewardsData, account, network, hidePrivateValue, addRequest }) => {
    const { showModal } = useModals()
    const claimableWalletToken = useClaimableWalletToken({ account, network, addRequest, relayerURL })

    const [rewards, setRewards] = useState({})
    const [rewardsTotal, setRewardsTotal] = useState(0)
    const { isLoading, data, errMsg } = rewardsData

    const showWalletTokenModal = () => showModal(<WalletTokenModal claimableWalletToken={claimableWalletToken} rewards={rewards} />)

    useEffect(() => {
        if (errMsg || !data || !data.success) return

        const { rewards, multipliers } = data
        if (!rewards.length) return

        const rewardsDetails = Object.fromEntries(rewards.map(({ _id, rewards }) => [_id, rewards[account.id] || 0]))
        const rewardsTotal = Object.values(rewardsDetails).reduce((acc, curr) => acc + curr, 0)
        rewardsDetails.multipliers = multipliers

        setRewardsTotal(rewardsTotal)
        setRewards(rewardsDetails)
    }, [data, errMsg, account])

    return (
        !isLoading && (errMsg || !data) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal}>{ hidePrivateValue(claimableWalletToken.claimableNow.toFixed(3)) } WALLET</Button>
    )
}

export default WalletTokenButton
