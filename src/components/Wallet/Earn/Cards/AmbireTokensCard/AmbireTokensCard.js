import { useState, useCallback, useMemo, useEffect } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { MdInfo } from "react-icons/md"
import { ToolTip, Button } from "components/common"
import { BigNumber, constants, Contract, utils } from "ethers"
import WalletStakingPoolABI from 'ambire-common/src/constants/abis/WalletStakingPoolABI.json'
import AdexStakingPool from 'ambire-common/src/constants/AdexStakingPool.json'
import supplyControllerABI from 'ambire-common/src/constants/ADXSupplyController.json'
import { Interface, parseUnits, formatUnits } from "ethers/lib/utils"
import { rpcProviders } from 'config/providers'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'
import AmbireEarnDetailsModal from 'components/Modals/AmbireEarnDetailsModal/AmbireEarnDetailsModal'
import { getTokenIcon } from 'lib/icons'
import { BsArrowUpSquare } from "react-icons/bs"
import walletABI from 'ambire-common/src/constants/abis/walletTokenABI.json'
import UnbondModal from "components/Modals/WalletTokenModal/UnbondModal/UnbondModal"

const ADX_TOKEN_ADDRESS = '0xade00c28244d5ce17d72e40330b1c318cd12b7c3'
const ADX_STAKING_TOKEN_ADDRESS = '0xb6456b57f03352be48bf101b46c1752a0813491a'
const ADX_STAKING_POOL_INTERFACE = new Interface(AdexStakingPool)
const ADDR_ADX_SUPPLY_CONTROLLER = '0x515629338229dd5f8cea3f4f3cc8185ba21fa30b'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'
const ADX_LABEL = 'ADX'
const WALLET_LABEL = 'WALLET'

const WALLET_LOCK_PERIOD_IN_DAYS = 30
const ADEX_LOCK_PERIOD_IN_DAYS = 20

// polygon tests
// const WALLET_TOKEN_ADDRESS = '0xe9415e904143e42007865e6864f7f632bd054a08'
// const WALLET_STAKING_ADDRESS = '0xec3b10ce9cabab5dbf49f946a623e294963fbb4e'

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

const attachMetaIfNeeded = (req, shareValue, rewardsData) => {
    let meta
    const shouldAttachMeta = [WALLET_TOKEN_ADDRESS, WALLET_STAKING_ADDRESS].includes(req.txn.to.toLowerCase())
    if (shouldAttachMeta) {
        const { walletUsdPrice: walletTokenUsdPrice, xWALLETAPY: APY } = rewardsData.rewards
        meta = { xWallet: { APY, shareValue, walletTokenUsdPrice } }
    }
    return !meta ? req : { ...req, meta: { ...req.meta && req.meta, ...meta }}
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
    const [adxCurrentAPY, setAdxCurrentAPY] = useState(null)
    const [isUnbondModalVisible, setIsUnbondModalVisible] = useState(false)
    const [isUnstakeConfirmed, setIsUnstakeConfirmed] = useState(false)
    const [validateData, setValidateData] = useState(null)

    const getLockDays = useCallback(() => {
        if (selectedToken.label === 'WALLET') return WALLET_LOCK_PERIOD_IN_DAYS
        else return ADEX_LOCK_PERIOD_IN_DAYS
    }, [selectedToken.label])
    
    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) => { 
        const request = attachMetaIfNeeded(
                { id, dateAdded: new Date().valueOf(), type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas },
                shareValue,
                rewardsData
            )

        addRequest(request)
    }, [networkDetails.chainId, accountId, shareValue, rewardsData, addRequest])

    const { xWALLETAPYPercentage } = rewardsData.rewards;

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
            label: WALLET_LABEL,
            value: WALLET_TOKEN_ADDRESS,
            symbol: WALLET_LABEL,
            balance: (walletToken?.balanceRaw && walletToken?.decimals) ? formatUnits(walletToken?.balanceRaw, walletToken?.decimals) : 0,
            balanceRaw: walletToken?.balanceRaw || 0,
        },
        {
            type: 'deposit',
            icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
            label: ADX_LABEL,
            value: ADX_TOKEN_ADDRESS,
            symbol: ADX_LABEL,
            balance: (adexToken?.balanceRaw && adexToken?.decimals) ? formatUnits(adexToken?.balanceRaw, adexToken?.decimals) : 0,
            balanceRaw: adexToken?.balanceRaw || 0,
        },
    ], [adexToken?.balanceRaw, adexToken?.decimals, networkId, walletToken?.balanceRaw, walletToken?.decimals])

    const withdrawTokenItems = useMemo(() => [   
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
            label: WALLET_LABEL,
            value: WALLET_STAKING_ADDRESS,
            symbol: WALLET_LABEL,
            balance: formatUnits(balanceRaw, xWalletToken?.decimals),
            balanceRaw,
        },
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
            label: ADX_LABEL,
            value: ADX_STAKING_TOKEN_ADDRESS,
            symbol: ADX_LABEL,
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
            to: addresses.stakingTokenAddress,
            value: '0x0',
            data: addresses.stakingPoolInterface.encodeFunctionData('withdraw', [shares.toHexString(), unlocksAt.toHexString(), false])
        })
    }, [addresses, leaveLog, addRequestTxn])

    const isAdxTokenSelected = useCallback(() => {
        return selectedToken.label === ADX_LABEL
    }, [selectedToken.label])

    const onTokenSelect = useCallback(tokenAddress => {
        setCustomInfo(null)

        const token = tokensItems.find(({ value }) => value === tokenAddress)

        setSelectedToken({label: token?.label}) 
        if (token && token.type === 'withdraw' && leaveLog && (parseFloat(leaveLog.walletValue) > 0)) {
            const unbondToolTipLabelMdg = `* Because of funds that are pending withdrawal, you are not able to unstake more ${selectedToken.label} tokens until the unbond period is over.`
            
            setCustomInfo(
                <>
                    <div className="info-message">
                        <ToolTip label={unbondToolTipLabelMdg}>
                            <span><b>{ msToDaysHours(lockedRemainingTime) }</b> until { parseFloat(leaveLog.walletValue).toFixed(4) } {selectedToken.label} becomes available for withdraw.&nbsp;<MdInfo/></span>
                        </ToolTip>
                    </div>
                    <Button 
                        disabled={lockedRemainingTime > 0}
                        startIcon={<BsArrowUpSquare/>}
                        onClick={onWithdraw}
                    >
                        Withdraw    
                    </Button>
                </>
            )
        }
        const apyTooltipMsg = `Annual Percentage Yield${selectedToken.label === 'WALLET' ? `: IN ADDITION to what you earn in ${selectedToken.label}s` : ''}`
        setDetails([
            [
                <>
                    <ToolTip label={apyTooltipMsg}>
                        <div>APY&nbsp;<MdInfo/></div>
                    </ToolTip>
                </>,
                isAdxTokenSelected() ? adxCurrentAPY ? `${adxCurrentAPY.toFixed(2)}%` : '...' : rewardsData.isLoading ? `...` : xWALLETAPYPercentage
            ],
            ['Lock', `${getLockDays()} day unbond period`],
            ['Type', 'Variable Rate'],
        ])
    }, [getLockDays, adxCurrentAPY, isAdxTokenSelected, leaveLog, lockedRemainingTime, onWithdraw, rewardsData.isLoading, selectedToken.label, tokensItems, xWALLETAPYPercentage])

    // NOTE: tokenAddress is unused because we have two tokens in this card, and we set everything in addresses
    const onValidate = async (type, _tokenAddress, amount, isMaxAmount) => {
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
            setIsUnbondModalVisible(true)
            setValidateData({bigNumberAmount, type, _tokenAddress, amount, isMaxAmount})
        }
    }

    const handleUnstake = useCallback(async ({bigNumberAmount, isMaxAmount}) => {
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
    }, [accountId, addRequestTxn, addresses, shareValue, stakingTokenContract])

    useEffect(() => {
        if (isUnstakeConfirmed && validateData != null) {
            handleUnstake(validateData)
            setIsUnbondModalVisible(false)
            setIsUnstakeConfirmed(false)
            setValidateData(null)
        }
    }, [isUnstakeConfirmed, handleUnstake, validateData])

    useEffect(() => {
        async function init() {
            try {
                // Prevent init if the card is unavailable for current network
                if (networkId !== 'ethereum') return

                const provider = rpcProviders['ethereum-ambire-earn']
                
                const tokenAddress = isAdxTokenSelected() ? ADX_TOKEN_ADDRESS : WALLET_TOKEN_ADDRESS
                const stakingTokenAddress = isAdxTokenSelected() ? ADX_STAKING_TOKEN_ADDRESS : WALLET_STAKING_ADDRESS
                const stakingPoolInterface = isAdxTokenSelected() ? ADX_STAKING_POOL_INTERFACE : WALLET_STAKING_POOL_INTERFACE
                const stakingPoolAbi = isAdxTokenSelected() ? AdexStakingPool : WalletStakingPoolABI
                const tokenAbi = isAdxTokenSelected() ? ERC20ABI : walletABI
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
                
                const [shareValue, sharesTotalSupply, stakingTokenBalanceRaw] = await Promise.all([
                    stakingTokenContract.shareValue(),
                    stakingTokenContract.totalSupply(),
                    stakingTokenContract.balanceOf(accountId),
                ])

                if (isAdxTokenSelected()) {
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
                if (leavesReadyToWithdraw.length) leavePendingToUnlockOrReadyToWithdraw = leavesReadyToWithdraw[0]
                else if (leavesPendingToUnlock.length) leavePendingToUnlockOrReadyToWithdraw = leavesPendingToUnlock[0]
                
                if (leavePendingToUnlockOrReadyToWithdraw) {
                    const {
                        maxTokens, 
                        shares, 
                        unlocksAt, 
                        walletValue } = leavePendingToUnlockOrReadyToWithdraw
                
                    setLeaveLog({
                        tokens: maxTokens,
                        shares,
                        unlocksAt,
                        walletValue: utils.formatUnits(walletValue.toString(), 18)
                    })
                
                    let remainingTime = unlocksAt ? ((unlocksAt.toString() * 1000) - Date.now()) : null
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
    }, [networkId, accountId, selectedToken.label, isAdxTokenSelected])

    useEffect(() => setLoading(false), [])

    return (
        <>
            <UnbondModal 
                isVisible={isUnbondModalVisible} 
                hideModal={() => setIsUnbondModalVisible(false)} 
                text={`There is a ${getLockDays()}-day lockup period for the tokens you are requesting to unbond. You will not be earning staking rewards on these tokens during these ${getLockDays()} days!`}
                onClick={() => setIsUnstakeConfirmed(true)}
            />
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
                    apy={isAdxTokenSelected()? adxCurrentAPY ? `${adxCurrentAPY.toFixed(2)}%` : '...' : xWALLETAPYPercentage}
                    accountId={accountId}
                    msToDaysHours={msToDaysHours}
                    addresses={addresses}
                    tokenLabel={selectedToken.label}
                />}
            />
        </>
    )
}

export default AmbireTokensCard
