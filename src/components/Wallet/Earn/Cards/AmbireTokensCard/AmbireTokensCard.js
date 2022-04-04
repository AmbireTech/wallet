import { useState, useCallback, useMemo, useEffect } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { MdInfo } from "react-icons/md"
import { ToolTip, Button } from "components/common"
import { BigNumber, constants, Contract, utils } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import AdexStakingPool from 'consts/AdexStakingPool.json'
import supplyControllerABI from 'consts/ADXSupplyController.json'
import { Interface, parseUnits, formatUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'
import { AmbireEarnDetailsModal } from 'components/Modals'
import { getTokenIcon } from 'lib/icons'
import { BsArrowUpSquare } from "react-icons/bs"
import walletABI from 'consts/walletTokenABI'

const ADX_TOKEN_ADDRESS = '0xade00c28244d5ce17d72e40330b1c318cd12b7c3'
const ADX_STAKING_TOKEN_ADDRESS = '0xb6456b57f03352be48bf101b46c1752a0813491a'
const ADX_STAKING_POOL_INTERFACE = new Interface(AdexStakingPool)
const ADDR_ADX_SUPPLY_CONTROLLER = '0x9d47f1c6ba4d66d8aa5e19226191a8968bc9094e'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'
const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)
const ZERO = BigNumber.from(0)

const secondsInYear = 60 * 60 * 24 * 365
const PRECISION = 1_000_000_000_000

const msToDaysHours = ms => {
    const day = 24 * 60 * 60 * 1000
    const days = Math.floor(ms / day)
    const hours = Math.floor((ms % day) / (60 * 60 * 1000))
    return days < 1 ? `${hours} hours` : `${days} days`
}

const AmbireTokensCard = ({ networkId, accountId, tokens, rewardsData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])
    const [customInfo, setCustomInfo] = useState(null)
    const [stakingTokenContract, setStakingTokenContract] = useState(null)
    const [shareValue, setShareValue] = useState(ZERO)
    const [stakingTokenBalanceRaw, SetStakingTokenBalanceRaw] = useState(null)
    const [leaveLog, setLeaveLog] = useState(null)
    const [lockedRemainingTime, setLockedRemainingTime] = useState(0)
    const [addresses, setAddresses] = useState({
        tokenAddress: '',
        stakingTokenAddress: '',
        stakingPoolInterface: '',
        stakingPoolAbi: '',
        tokenAbi: ''
    })
    const [selectedToken, setSelectedToken] = useState({ label: ''})
    const [adxCurrentAPY, setAdxCurrentAPY] = useState(0.00)

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) =>
        addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    , [networkDetails.chainId, accountId, addRequest])
    
    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.xWALLETAPY * 100).toFixed(2) : 0

    const walletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS), [tokens])
    const xWalletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS), [tokens])
    const adexToken = useMemo(() => tokens.find(({address}) => address === ADX_TOKEN_ADDRESS), [tokens])
    const adexStakingToken = useMemo(() => tokens.find(({address}) => address === ADX_STAKING_TOKEN_ADDRESS), [tokens])

    const balanceRaw = useMemo(() => stakingTokenBalanceRaw ? (BigNumber.from(stakingTokenBalanceRaw).mul(shareValue)).div(BigNumber.from((1e18).toString())).toString() : 0,
    [stakingTokenBalanceRaw, shareValue])

    const depositTokenItems = useMemo(() => [
        {
            type: 'deposit',
            icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
            label: 'WALLET',
            value: WALLET_TOKEN_ADDRESS,
            symbol: 'WALLET',
            balance: (walletToken?.balanceRaw && walletToken?.decimals) ? formatUnits(walletToken?.balanceRaw, walletToken?.decimals) : 0,
            balanceRaw: walletToken?.balanceRaw || 0,
        },
        {
            type: 'deposit',
            icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
            label: 'ADX',
            value: ADX_TOKEN_ADDRESS,
            symbol: 'ADX',
            balance: (adexToken?.balanceRaw && adexToken?.decimals) ? formatUnits(adexToken?.balanceRaw, adexToken?.decimals) : 0,
            balanceRaw: adexToken?.balanceRaw || 0,
        },
    ], [adexToken?.balanceRaw, adexToken?.decimals, networkId, walletToken?.balanceRaw, walletToken?.decimals])

    const withdrawTokenItems = useMemo(() => [   
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
            label: 'WALLET',
            value: WALLET_STAKING_ADDRESS,
            symbol: 'WALLET',
            balance: formatUnits(balanceRaw, xWalletToken?.decimals),
            balanceRaw,
        },
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
            label: 'ADX',
            value: ADX_STAKING_TOKEN_ADDRESS,
            symbol: 'ADX',
            balance: formatUnits(balanceRaw, adexStakingToken?.decimals),
            balanceRaw,
        },
    ], [adexStakingToken?.decimals, balanceRaw, networkId, xWalletToken?.decimals])
    
    const tokensItems = useMemo(() => [
        ...depositTokenItems.sort((x,y) => x.value === addresses.tokenAddress ? -1 : y.value === addresses.tokenAddress ? 1 : 0),
        ...withdrawTokenItems.sort((x,y) => x.value === addresses.stakingTokenAddress ? -1 : y.value === addresses.stakingTokenAddress ? 1 : 0)
    ], [addresses.stakingTokenAddress, addresses.tokenAddress, depositTokenItems, withdrawTokenItems])

    const onWithdraw = useCallback(() => {
        const { shares, unlocksAt } = leaveLog
        addRequestTxn(`withdraw_staking_pool_${Date.now()}`, {
            to: WALLET_STAKING_ADDRESS,
            value: '0x0',
            data: WALLET_STAKING_POOL_INTERFACE.encodeFunctionData('withdraw', [shares.toHexString(), unlocksAt.toHexString(), false])
        })
    }, [leaveLog, addRequestTxn])

    const onTokenSelect = useCallback(tokenAddress => {
        setCustomInfo(null)

        const token = tokensItems.find(({ value }) => value === tokenAddress)

        setSelectedToken({label: token?.label}) 
        if (token && token.type === 'withdraw' && leaveLog && (parseFloat(leaveLog.walletValue) > 0)) {
            const unbondToolTipLabelMdg = `* Because of pending to withdraw, you are not able to unstaking more ${selectedToken.label} until unbond period is end.`
            
            setCustomInfo(
                <>
                    <div className="info-message">
                        <ToolTip label={unbondToolTipLabelMdg}>
                            <span><b>{ msToDaysHours(lockedRemainingTime) }</b> until { parseFloat(leaveLog.walletValue).toFixed(4) } WALLET becomes available for withdraw.&nbsp;<MdInfo/></span>
                        </ToolTip>
                    </div>
                    <Button 
                        disabled={lockedRemainingTime > 0}
                        icon={<BsArrowUpSquare/>}
                        onClick={() => onWithdraw()}
                    >
                        Withdraw    
                    </Button>
                </>
            )
        }
        const apyTooltipMsg = `Annual Percentage Yield: IN ADDITION to what you earn in ${selectedToken.label}s`
        setDetails([
            [
                <>
                    <ToolTip label={apyTooltipMsg}>
                        <div>APY&nbsp;<MdInfo/></div>
                    </ToolTip>
                </>,
                selectedToken.label === 'ADX' ? `${adxCurrentAPY.toFixed(2)}%` : rewardsData.isLoading ? `...` : `${walletTokenAPY}%`
            ],
            ['Lock', '20 day unbond period'],
            ['Type', 'Variable Rate'],
        ])
    }, [adxCurrentAPY, leaveLog, lockedRemainingTime, onWithdraw, rewardsData.isLoading, selectedToken.label, tokensItems, walletTokenAPY])

    const onValidate = async (type, tokenAddress, amount, isMaxAmount) => {
        const bigNumberAmount = parseUnits(amount, 18)

        if (type === 'Deposit') {
            const allowance = await stakingTokenContract.allowance(accountId, addresses.stakingTokenAddress)

            if (allowance.lt(constants.MaxUint256)) {
                addRequestTxn(`approve_staking_pool_${Date.now()}`, {
                    to: addresses.tokenAddress,
                    value: '0x0',
                    data: ERC20_INTERFACE.encodeFunctionData('approve', [addresses.stakingTokenAddress, constants.MaxUint256])
                })
            }

            addRequestTxn(`enter_staking_pool_${Date.now()}`, {
                to: addresses.stakingTokenAddress,
                value: '0x0',
                data: addresses.stakingPoolInterface.encodeFunctionData('enter', [bigNumberAmount.toHexString()])
            })
        }

        if (type === 'Withdraw') {
            let xWalletAmount
            // In case of withdrawing the max amount of xWallet tokens, get the latest balance of xWallet.
            // Otherwise, `stakingTokenBalanceRaw` may be outdated.
            if (isMaxAmount) {
                xWalletAmount = await stakingTokenContract.balanceOf(accountId)
            } else {
                xWalletAmount = bigNumberAmount.mul(BigNumber.from((1e18).toString())).div(shareValue)
            }

            addRequestTxn(`leave_staking_pool_${Date.now()}`, {
                to: addresses.stakingTokenAddress,
                value: '0x0',
                data: addresses.stakingPoolInterface.encodeFunctionData('leave', [xWalletAmount.toHexString(), false])
            })
        }
    }

    useEffect(() => {
        async function init() {
            try {
                // Prevent init if the card is unavailable for current network
                if (networkId !== 'ethereum') return

                const provider = getProvider(networkId)
                
                const tokenAddress = selectedToken.label === 'ADX' ? ADX_TOKEN_ADDRESS : WALLET_TOKEN_ADDRESS
                const stakingTokenAddress = selectedToken.label === 'ADX' ? ADX_STAKING_TOKEN_ADDRESS : WALLET_STAKING_ADDRESS
                const stakingPoolInterface = selectedToken.label === 'ADX' ? ADX_STAKING_POOL_INTERFACE : WALLET_STAKING_POOL_INTERFACE
                const stakingPoolAbi = selectedToken.label === 'ADX' ? AdexStakingPool : WalletStakingPoolABI
                const tokenAbi = selectedToken.label === 'ADX' ? ERC20ABI : walletABI
                const stakingTokenContract = new Contract(stakingTokenAddress, stakingPoolInterface, provider)
                const tokenContract = new Contract(tokenAddress, tokenAbi, provider)
                const supplyController = new Contract(
                    ADDR_ADX_SUPPLY_CONTROLLER,
                    supplyControllerABI,
                    provider
                )
                setStakingTokenContract(stakingTokenContract)
                
                setAddresses({
                    tokenAddress,
                    stakingTokenAddress,
                    stakingPoolInterface,
                    stakingPoolAbi,
                    tokenAbi
                })
                
                const [timeToUnbond, shareValue, sharesTotalSupply, stakingTokenBalanceRaw] = await Promise.all([
                    stakingTokenContract.timeToUnbond(),
                    stakingTokenContract.shareValue(),
                    stakingTokenContract.totalSupply(),
                    stakingTokenContract.balanceOf(accountId),
                ])

                if (selectedToken.label === 'ADX') {
                    const [incentivePerSecond, poolTotalStaked] = await Promise.all([
                        supplyController.incentivePerSecond(ADX_STAKING_TOKEN_ADDRESS),
                        tokenContract.balanceOf(stakingTokenAddress),
                    ])
                    
                    const currentAPY = incentivePerSecond
                        .mul(PRECISION)
                        .mul(secondsInYear)
                        .div(poolTotalStaked)
                        .toNumber() / PRECISION
                    
                    setAdxCurrentAPY(currentAPY * 100)
                }

                setShareValue(shareValue)
                SetStakingTokenBalanceRaw(stakingTokenBalanceRaw)

                const [leaveLogs, withdrawLogs] = await Promise.all([
                    provider.getLogs({
                        fromBlock: 0,
                        ...stakingTokenContract.filters.LogLeave(accountId, null, null, null)
                    }),
                    provider.getLogs({
                        fromBlock: 0,
                        ...stakingTokenContract.filters.LogWithdraw(
                            accountId,
                            null,
                            null,
                            null,
                            null
                        ),
                    })
                ])

                const userWithdraws = withdrawLogs.map(log => {
                    const parsedWithdrawLog = stakingTokenContract.interface.parseLog(log)
                    const { shares, unlocksAt, maxTokens, receivedTokens } =
                        parsedWithdrawLog.args
        
                    return {
                        transactionHash: log.transactionHash,
                        type: 'withdraw',
                        shares,
                        unlocksAt, 
                        maxTokens, 
                        receivedTokens,
                        blockNumber: log.blockNumber,
                    }
                })
                
                const now = new Date() / 1000
                const userLeaves = await Promise.all(
                    leaveLogs.map(async log => {
                        const parsedLog = stakingTokenContract.interface.parseLog(log)
                        const { maxTokens, shares, unlocksAt } = parsedLog.args

                        const withdrawTx = userWithdraws.find(
                            event =>
                                event.unlocksAt.toString() === unlocksAt.toString() &&
                                event.shares.toString() === shares.toString() &&
                                event.maxTokens.toString() === maxTokens.toString()
                        )

                        const walletValue = sharesTotalSupply.isZero()
                        ? ZERO
                        : await stakingTokenContract.unbondingCommitmentWorth(
                            accountId,
                            shares,
                            unlocksAt
                        )

                        return {
                            transactionHash: log.transactionHash,
                            type: 'leave',
                            maxTokens,
                            shares,
                            unlocksAt,
                            blockNumber: log.blockNumber,
                            walletValue,
                            withdrawTx
                        }
                    })
                )
                const leavesPendingToUnlock = [...userLeaves].filter(
                    event => event.unlocksAt > now
                )
        
                const leavesReadyToWithdraw = [...userLeaves].filter(
                    event => event.unlocksAt < now && !event.withdrawTx
                )

                let leavePendingToUnlockOrReadyToWithdraw = null 
                if (leavesPendingToUnlock.length) leavePendingToUnlockOrReadyToWithdraw = leavesPendingToUnlock[0]
                else if (leavesReadyToWithdraw.length) leavePendingToUnlockOrReadyToWithdraw = leavesReadyToWithdraw[0]
                
                if (leavePendingToUnlockOrReadyToWithdraw) {
                    const {
                        maxTokens, 
                        shares, 
                        unlocksAt, 
                        blockNumber, 
                        walletValue } = leavePendingToUnlockOrReadyToWithdraw
                
                    setLeaveLog({
                        tokens: maxTokens,
                        shares,
                        unlocksAt,
                        walletValue: utils.formatUnits(walletValue.toString(), 18)
                    })
                
                    const { timestamp } = await provider.getBlock(blockNumber)
                    let remainingTime = (timeToUnbond.toString() * 1000) - (Date.now() - (timestamp * 1000))
                    if (remainingTime <= 0) remainingTime = 0
                    setLockedRemainingTime(remainingTime)    
                } else {
                    setLeaveLog(null)
                }
            } catch(e) {
                console.error(e)
            }
        }
        init()
        return () => {
            setShareValue(ZERO)
        }
    }, [networkId, accountId, selectedToken.label])

    useEffect(() => setLoading(false), [])

    return (
        <Card
            loading={loading || (!stakingTokenBalanceRaw && !unavailable)}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            customInfo={customInfo}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
            moreDetails={!unavailable && <AmbireEarnDetailsModal 
                apy={selectedToken.label === 'ADX'? adxCurrentAPY.toFixed(2) : walletTokenAPY}
                accountId={accountId}
                msToDaysHours={msToDaysHours}
                addresses={addresses}
                tokenLabel={selectedToken.label}
            />}
        />
    )
}

export default AmbireTokensCard
