import { useMemo, useState, useEffect, useCallback } from 'react'
import { Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { getProvider } from 'lib/provider'

import WALLETVestings from 'consts/WALLETVestings'
import WALLETInitialClaimableRewards from 'consts/WALLETInitialClaimableRewards'
import WALLETSupplyControllerABI from 'consts/WALLETSupplyControllerABI'

const supplyControllerAddress = '0xc53af25f831f31ad6256a742b3f0905bc214a430'
const supplyControllerInterface = new Interface(WALLETSupplyControllerABI)

const useClaimableWalletToken = ({ account = {}, network, addRequest }) => {
    const provider = useMemo(() => getProvider('ethereum'), [])
    const supplyController = useMemo(() => new Contract(supplyControllerAddress, WALLETSupplyControllerABI, provider), [provider])
    const initialClaimableEntry = WALLETInitialClaimableRewards.find(x => x.addr === account.id)
    const initialClaimable = initialClaimableEntry ? initialClaimableEntry.totalClaimable / 1e18 : 0
    const vestingEntry = WALLETVestings.find(x => x.addr === account.id)

    const [currentClaimStatus, setCurrentClaimStatus] = useState({ loading: true, claimed: 0, mintableVesting: 0, error: null })
    // by adding this to the deps, we make it refresh every 10 mins
    const refreshSlot = Math.floor(Date.now() / 60000)
    useEffect(() => {
        setCurrentClaimStatus({ loading: true, claimed: 0, mintableVesting: 0, error: null });

        (async () => {
            const toNum = x => parseInt(x.toString()) / 1e18
            const [mintableVesting, claimed] = await Promise.all([
                vestingEntry ? await supplyController.mintableVesting(vestingEntry.addr, vestingEntry.end, vestingEntry.rate).then(toNum) : null,
                initialClaimableEntry ? await supplyController.claimed(initialClaimableEntry.addr).then(toNum) : null
            ])
            return { mintableVesting, claimed }
        })()
            .then(status => setCurrentClaimStatus(status))
            .catch(e => {
                console.error('getting claim status', e)
                setCurrentClaimStatus({ error: e.message || e })
            })
    }, [supplyController, vestingEntry, initialClaimableEntry, refreshSlot])

    const claimableNow = (initialClaimable - (currentClaimStatus.claimed || 0) < 0) ? 0 : (initialClaimable - (currentClaimStatus.claimed || 0))
    const disabledReason = network.id !== 'ethereum' ? 'Switch to Ethereum to claim' : (
        currentClaimStatus.error ? `Claim status error: ${currentClaimStatus.error}` : null
    )
    const claimDisabledReason = claimableNow === 0 ? 'No rewards are claimable' : null
    const claimEarlyRewards = useCallback((withoutBurn = true) => {
        addRequest({
            id: 'claim_'+Date.now(),
            chainId: network.chainId,
            type: 'eth_sendTransaction',
            account: account.id,
            txn: {
                to: supplyControllerAddress,
                value: '0x0',
                data: supplyControllerInterface.encodeFunctionData('claim', [
                    initialClaimableEntry.totalClaimable,
                    initialClaimableEntry.proof,
                    withoutBurn ? 0 : 3000, // penalty bps, at the moment we run with 0; it's a safety feature to hardcode it
                    '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935' // staking pool addr
                ])
            }
        })    
    }, [initialClaimableEntry, network.chainId, account.id, addRequest])
    const claimVesting = useCallback(() => {
        addRequest({
            id: 'claimVesting_'+Date.now(),
            chainId: network.chainId,
            account: account.id,
            type: 'eth_sendTransaction',
            txn: {
                to: supplyControllerAddress,
                value: '0x0',
                data: supplyControllerInterface.encodeFunctionData('mintVesting', [vestingEntry.addr, vestingEntry.end, vestingEntry.rate])
            }
        })    
    }, [vestingEntry, network.chainId, account.id, addRequest])

    return {
        vestingEntry,
        currentClaimStatus,
        claimableNow,
        disabledReason,
        claimDisabledReason,
        claimEarlyRewards,
        claimVesting
    }
}

export default useClaimableWalletToken