import './WalletTokenModal.scss'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Button, Modal, ToolTip } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { getProvider } from 'lib/provider'

import WALLETVestings from 'consts/WALLETVestings'
import WALLETInitialClaimableRewards from 'consts/WALLETInitialClaimableRewards'
import WALLETSupplyControllerABI from 'consts/WALLETSupplyControllerABI'

const multiplierBadges = [
    {
        id: 'beta-tester',
        name: 'Beta Testers',
        icon: '🧪',
        color: '#6000FF',
        multiplier: 1.25,
        link: 'https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747'
    },
    {
        id: 'lobsters',
        name: 'Lobsters',
        icon: '🦞',
        color: '#E82949',
        multiplier: 1.50,
        link: 'https://blog.ambire.com/ambire-wallet-to-partner-with-lobsterdao-10b57e6da0-53c59c88726b'
    }
]
const MultiplierBadges = ({ rewards }) => {
    // Multiplier badges
    const badges = useMemo(() => multiplierBadges.map(badge => {
        const isUnlocked = rewards.multipliers && rewards.multipliers.map(({ name }) => name).includes(badge.id)
        return {
            ...badge,
            active: isUnlocked
        }
    }), [rewards])

    return (<div className="badges">
        {
            badges.map(({ id, name, icon, color, multiplier, link, active }) => (
                <a href={link} target="_blank" rel="noreferrer" key={id}>
                    <ToolTip label={`You ${active ? 'are receiving' : 'do not have'} the ${name} x${multiplier} multiplier`}>
                        <div className={`badge ${active ? 'active' : ''}`} style={{ backgroundColor: color, borderColor: color }}>
                            <div className="icon">{ icon }</div>
                            <div className="multiplier">x { multiplier }</div>
                        </div>
                    </ToolTip>
                </a>
            ))
        }
    </div>)
}

const supplyControllerAddress = '0x94b668337ce8299272ca3cb0c70f3d786a5b6ce5'
const supplyControllerInterface = new Interface(WALLETSupplyControllerABI)
const WalletTokenModal = ({ rewards, account, network, addRequest }) => {
    const { hideModal } = useModals()

    const provider = useMemo(() => getProvider('ethereum'), [])
    const supplyController = useMemo(() => new Contract(supplyControllerAddress, WALLETSupplyControllerABI, provider), [provider])
    const initialClaimableEntry = WALLETInitialClaimableRewards.find(x => x.addr === account.id)
    const initialClaimable = initialClaimableEntry ? initialClaimableEntry.totalClaimable : 0
    const vestingEntry = WALLETVestings.find(x => x.addr === account.id)

    const [currentClaimStatus, setCurrentClaimStatus] = useState({ loading: true, claimed: 0, mintableVesting: 0, error: null })
    useEffect(() => {
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
    }, [supplyController, vestingEntry, initialClaimableEntry])

    const claimableNow = initialClaimable - currentClaimStatus.claimed
    const disabledReason = network.id !== 'ethereum' ? 'Switch to Ethereum to claim' : (
        currentClaimStatus.error ? `Claim status error: ${currentClaimStatus.error}` : null
    )
    const claimDisabledReason = claimableNow === 0 ? 'No rewards are claimable' : null
    const claimEarlyRewards = useCallback(() => {
        addRequest({
            id: 'claim_'+Date.now(),
            chainId: network.chainId,
            type: 'eth_sendTransaction',
            account: account.id,
            txn: {
                to: supplyControllerAddress,
                value: '0x0',
                data: supplyControllerInterface.encodeFunctionData('claim', [
                    initialClaimableEntry.addr,
                    initialClaimableEntry.totalClaimableBN,
                    initialClaimableEntry.proof,
                    0, // penalty bps, at the moment we run with 0; it's a safety feature to hardcode it
                    '0x0000000000000000000000000000000000000000' // staking addr, no need to pass this
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

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>
    return (
        <Modal id="wallet-token-modal" title="WALLET token distribution" buttons={modalButtons}>
            <div className="item">
                <div className="details">
                    <label>Early users Incentive: Total</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ rewards['balance-rewards'] }</span></div>
                        {/* <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div> */}
                    </div>
                </div>
                <div className="actions">
                    { /* claimButton */ }
                </div>
            </div>
            {/* <div className="item">
                <div className="details">
                    <label>Referral Incentive</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">0</span></div>
                        <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div>
                    </div>
                </div>
                <div className="actions">
                    { claimButton }
                </div>
            </div> */}
            <div className="item">
                <div className="details">
                    <label>ADX Staking Bonus: Total</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ rewards['adx-rewards'] }</span></div>
                        {/* <div className="amount-dollar"><span className="secondary-accent">$</span> 0</div> */}
                    </div>
                </div>
                <div className="actions">
                    { /* claimButton */ }
                </div>
            </div>

            <div className="item">
                <div className="details">
                    <label>Claimable now: early users + ADX Staking bonus</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{
                            currentClaimStatus.loading ? '...' : claimableNow
                        }</span></div>
                    </div>
                </div>
                <div className="actions">
                    <ToolTip label={
                            claimDisabledReason || disabledReason || 'Claimable amount is 20% of the snapshot on 01 Feb 2022'
                        }>
                        <Button small clear onClick={claimEarlyRewards} disabled={!!(claimDisabledReason || disabledReason)}>CLAIM</Button>
                    </ToolTip>
                </div>
            </div>

            {!!currentClaimStatus.mintableVesting && !!vestingEntry && (
            <div className="item">
                <div className="details">
                    <label>Claimable early supporters vesting</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{
                            currentClaimStatus.mintableVesting
                        }</span></div>
                    </div>
                </div>
                <div className="actions">
                    <ToolTip label={
                            disabledReason || `Linearly vested over approximately ${Math.ceil((vestingEntry.end - vestingEntry.start) / 86400)} days`
                        }>
                        <Button small clear onClick={claimVesting} disabled={!!disabledReason}>CLAIM</Button>
                    </ToolTip>
                </div>
            </div>
            )}

            <MultiplierBadges rewards={rewards}/>
            <div id="info">
                You are receiving $WALLETS for holding funds on your Ambire wallet as an early user. <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
            </div>
        </Modal>
    )
}

export default WalletTokenModal
