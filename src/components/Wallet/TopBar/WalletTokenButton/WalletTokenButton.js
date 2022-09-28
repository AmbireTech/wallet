import { useEffect, useState, useCallback } from "react"
import useDynamicModal from "hooks/useDynamicModals"
import { Button, ToolTip } from "components/common"
import { WalletTokenModal, CongratsRewardsModal } from "components/Modals"
import { useLocalStorage } from 'hooks'
import useClaimableWalletToken from 'ambire-common/src/hooks/useClaimableWalletToken'

const WalletTokenButton = ({ rewardsData, account = {}, network, hidePrivateValue, addRequest }) => {
    const claimableWalletToken = useClaimableWalletToken({
        accountId: account.id,
        network,
        addRequest,
        totalLifetimeRewards: rewardsData.rewards.totalLifetimeRewards,
        walletUsdPrice: rewardsData.rewards.walletUsdPrice,
      })
    const { currentClaimStatus, pendingTokensTotal } = claimableWalletToken
    const { isLoading: isRewardsDataLoading, errMsg } = rewardsData
    const isLoading = isRewardsDataLoading || currentClaimStatus.loading;

    const showWalletTokenModal = useDynamicModal(WalletTokenModal, { claimableWalletToken, accountId: account.id }, { rewards: rewardsData.rewards })
   
    const [currentCongratsModalState, setCurrentCongratsModalState] = useState(null) 
    const defaultCongratsModalShownState = (currentClaimStatus && (currentClaimStatus.claimed === 0) && (currentClaimStatus.mintableVesting === 0) && (pendingTokensTotal && pendingTokensTotal !== '...' && parseFloat(pendingTokensTotal) === 0) ) ? false : true
    const [congratsModalState, setCongratsModalState] = useLocalStorage({
        key: 'congratsModalState',
        defaultValue: []
    })
    
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
    
    return (
        !isLoading && (errMsg || currentClaimStatus.error) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
                <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal}>{ isLoading ? '...' : hidePrivateValue(pendingTokensTotal) } WALLET</Button>
    )
}

export default WalletTokenButton
