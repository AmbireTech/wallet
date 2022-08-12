import { useEffect, useState, useCallback } from "react"
import useDynamicModal from "hooks/useDynamicModals"
import { Button, ToolTip } from "components/common"
import { WalletTokenModal, CongratsRewardsModal } from "components/Modals"
import useClaimableWalletToken from "./useClaimableWalletToken"
import { useLocalStorage } from 'hooks'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest }) => {
    const claimableWalletToken = useClaimableWalletToken({ account, network, addRequest })
    const { currentClaimStatus } = claimableWalletToken
    const totalLifetimeRewards = rewardsData.data?.rewards?.map(x => x.rewards[account.id] || 0).reduce((a, b) => a + b, 0)
    const pendingTokensTotal = (currentClaimStatus && !currentClaimStatus.loading && totalLifetimeRewards > 0)
        ?
            ((totalLifetimeRewards || 0) 
            - (currentClaimStatus.claimed || 0) 
            - (currentClaimStatus.claimedInitial || 0 ) 
            + (currentClaimStatus.mintableVesting || 0)).toFixed(3) 
        : '...'
    const [rewards, setRewards] = useState({})
    const { isLoading, data, errMsg } = rewardsData
   
    const [currentCongratsModalState, setCurrentCongratsModalState] = useState(null) 
    const defaultCongratsModalShownState = (currentClaimStatus && (currentClaimStatus.claimed === 0) && (currentClaimStatus.mintableVesting === 0) && (pendingTokensTotal && pendingTokensTotal !== '...' && parseFloat(pendingTokensTotal) === 0) ) ? false : true
    const [congratsModalState, setCongratsModalState] = useLocalStorage({
        key: 'congratsModalState',
        defaultValue: []
    })
    // debugger
    useEffect(() => {
        if (congratsModalState.length === 0) setCongratsModalState([{ account: account.id, isCongratsModalShown: defaultCongratsModalShownState }])
        if (congratsModalState.length && !congratsModalState.find(i => i.account === account.id)) {
            setCongratsModalState([...congratsModalState, { account: account.id, isCongratsModalShown: defaultCongratsModalShownState }])
        }
        
        if (congratsModalState.length) {
            const isFound = congratsModalState.find(i => i.account === account.id)
            if (isFound) setCurrentCongratsModalState(isFound)
        }  
    }, [account.id, congratsModalState, defaultCongratsModalShownState, setCongratsModalState])
    
    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards })
    const handleCongratsRewardsModal = useDynamicModal(CongratsRewardsModal, { pendingTokensTotal })
    const showCongratsRewardsModal = useCallback(() => {
        if (parseFloat(pendingTokensTotal) > 0 && !currentCongratsModalState.isCongratsModalShown) {
            const updated = congratsModalState.map(item => (item.account === account.id) ? 
            { ...item, isCongratsModalShown: true } : item)

            setCongratsModalState(updated)
            handleCongratsRewardsModal()
        }
        
    }, [pendingTokensTotal, currentCongratsModalState, setCongratsModalState, congratsModalState, account.id, handleCongratsRewardsModal])
    
    useEffect(() => showCongratsRewardsModal(), [showCongratsRewardsModal])
    useEffect(() => {
        if (errMsg || !data || !data.success) return

        const { rewards, multipliers } = data
        if (!rewards.length) return

        const rewardsDetails = Object.fromEntries(rewards.map(({ _id, rewards }) => [_id, rewards[account.id] || 0]))
        rewardsDetails.multipliers = multipliers
        rewardsDetails.walletTokenAPY = data.walletTokenAPY
        rewardsDetails.adxTokenAPY = data.adxTokenAPY
        rewardsDetails.walletUsdPrice = data.usdPrice
        rewardsDetails.xWALLETAPY = data.xWALLETAPY
        setRewards(rewardsDetails)
    }, [data, errMsg, account])

    return (
        !isLoading && (errMsg || !data || currentClaimStatus.error) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal}>{ isLoading ? '...' : hidePrivateValue(pendingTokensTotal) } WALLET</Button>
    )
}

export default WalletTokenButton
