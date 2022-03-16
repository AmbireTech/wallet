import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { MdInfo } from "react-icons/md"
import { ToolTip, Button } from "components/common"
import { BigNumber, constants, Contract, utils } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import AdexStakingPool from 'consts/AdexStakingPool.json'
import { Interface, parseUnits, formatUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'
import { WalletEarnDetailsModal } from 'components/Modals'
import { getTokenIcon } from 'lib/icons'
import { BsArrowUpSquare } from "react-icons/bs"

const ADX_TOKEN_ADDRESS = '0xADE00C28244d5CE17D72E40330B1c318cD12B7c3'
const ADX_STAKING_TOKEN_ADDRESS = '0xB6456b57f03352bE48Bf101B46c1752a0813491a'
const ADX_STAKING_POOL_INTERFACE = new Interface(AdexStakingPool)

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'
const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)
const ZERO = BigNumber.from(0)

const msToDaysHours = ms => {
    const day = 24 * 60 * 60 * 1000
    const days = Math.floor(ms / day)
    const hours = Math.floor((ms % day) / (60 * 60 * 1000))
    return days < 1 ? `${hours} hours` : `${days} days`
}

const WalletTokenCard = ({ networkId, accountId, tokens, rewardsData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])
    const [customInfo, setCustomInfo] = useState(null)
    const [stakingWalletContract, setStakingWalletContract] = useState(null)
    const [shareValue, setShareValue] = useState(ZERO)
    const [xWalletBalanceRaw, setXWalletBalanceRaw] = useState(null)
    const [leaveLog, setLeaveLog] = useState(null)
    const [lockedRemainingTime, setLockedRemainingTime] = useState(0)
    const selectedToken = useRef()

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) =>
        addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    , [networkDetails.chainId, accountId, addRequest])
    
    //TODO: add adexStakingAPY
    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.xWALLETAPY * 100).toFixed(2) : 0

    const walletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS), [tokens])
    const xWalletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS), [tokens])
    const adexToken = useMemo(() => tokens.find(({address}) => address === ADX_TOKEN_ADDRESS), [tokens])
    const adexStakingToken = useMemo(() => tokens.find(({address}) => address === ADX_STAKING_TOKEN_ADDRESS), [tokens])

    const balanceRaw = useMemo(() => xWalletBalanceRaw ? (BigNumber.from(xWalletBalanceRaw).mul(shareValue)).div(BigNumber.from((1e18).toString())).toString() : 0,
    [xWalletBalanceRaw, shareValue])

    const tokensItems = useMemo(() => [
        {
            type: 'deposit',
            icon: getTokenIcon(networkId, ADX_TOKEN_ADDRESS),
            label: 'ADEX',
            value: ADX_TOKEN_ADDRESS,
            symbol: 'ADX',
            balance: adexToken?.balance || 0,
            balanceRaw: adexToken?.balanceRaw || 0,
        },
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, ADX_STAKING_TOKEN_ADDRESS),
            label: 'ADEX-STAKING',
            value: ADX_STAKING_TOKEN_ADDRESS,
            symbol: 'ADX-STAKING',
            balance: formatUnits(balanceRaw, adexStakingToken?.decimals),
            balanceRaw,
        },
        {
            type: 'deposit',
            icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
            label: 'WALLET',
            value: WALLET_TOKEN_ADDRESS,
            symbol: 'WALLET',
            balance: walletToken?.balance || 0,
            balanceRaw: walletToken?.balanceRaw || 0,
        },
        {
            type: 'withdraw',
            icon: getTokenIcon(networkId, WALLET_TOKEN_ADDRESS),
            label: 'WALLET',
            value: WALLET_STAKING_ADDRESS,
            symbol: 'WALLET',
            balance: formatUnits(balanceRaw, xWalletToken?.decimals),
            balanceRaw,
        }
    ], [networkId, adexToken?.balance, adexToken?.balanceRaw, balanceRaw, adexStakingToken?.decimals, walletToken?.balance, walletToken?.balanceRaw, xWalletToken?.decimals])
    
    const getToken = (type, address) => tokensItems.filter(token => token.type === type).find(token => token.value === address)

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
        selectedToken.current = token
        if (token && token.type === 'withdraw' && leaveLog && (parseFloat(leaveLog.walletValue) > 0)) {
            setCustomInfo(
                <>
                    <div className="info-message">
                        <ToolTip label='* Because of pending to withdraw, you are not able to unstaking more WALLET until unbond period is end.'>
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

        setDetails([
            [
                <>
                    <ToolTip label="Annual Percentage Yield: IN ADDITION to what you earn in $WALLETs">
                        <div>APY&nbsp;<MdInfo/></div>
                    </ToolTip>
                </>,
                rewardsData.isLoading ? `...` : `${walletTokenAPY}%`
            ],
            ['Lock', '20 day unbond period'],
            ['Type', 'Variable Rate'],
        ])
    }, [leaveLog, lockedRemainingTime, onWithdraw, rewardsData.isLoading, tokensItems, walletTokenAPY])

    const onValidate = async (type, tokenAddress, amount, isMaxAmount) => {
        console.log('tokenAddress', tokenAddress)
        
        const bigNumberAmount = parseUnits(amount, 18)

        if (type === 'Deposit') {
            const token = getToken('deposit', tokenAddress)
            console.log('token deposit', token)
            const allowance = await stakingWalletContract.allowance(accountId, WALLET_STAKING_ADDRESS)

            if (allowance.lt(constants.MaxUint256)) {
                addRequestTxn(`approve_staking_pool_${Date.now()}`, {
                    to: WALLET_TOKEN_ADDRESS,
                    value: '0x0',
                    data: ERC20_INTERFACE.encodeFunctionData('approve', [WALLET_STAKING_ADDRESS, constants.MaxUint256])
                })
            }

            addRequestTxn(`enter_staking_pool_${Date.now()}`, {
                to: WALLET_STAKING_ADDRESS,
                value: '0x0',
                data: WALLET_STAKING_POOL_INTERFACE.encodeFunctionData('enter', [bigNumberAmount.toHexString()])
            })
        }

        if (type === 'Withdraw') {
            let xWalletAmount
            const token = getToken('withdraw', tokenAddress)
            console.log('token Withdraw', token)
            // In case of withdrawing the max amount of xWallet tokens, get the latest balance of xWallet.
            // Otherwise, `xWalletBalanceRaw` may be outdated.
            if (isMaxAmount) {
                xWalletAmount = await stakingWalletContract.balanceOf(accountId)
            } else {
                xWalletAmount = bigNumberAmount.mul(BigNumber.from((1e18).toString())).div(shareValue)
            }

            addRequestTxn(`leave_staking_pool_${Date.now()}`, {
                to: WALLET_STAKING_ADDRESS,
                value: '0x0',
                data: WALLET_STAKING_POOL_INTERFACE.encodeFunctionData('leave', [xWalletAmount.toHexString(), false])
            })
        }
    }

    useEffect(() => {
        async function init() {
            try {
                const provider = getProvider(networkId)
                console.log('selectedToken.current', selectedToken.current)
                // const stakingWalletContract = new Contract(WALLET_STAKING_ADDRESS, WALLET_STAKING_POOL_INTERFACE, provider)
                const stakingWalletContract = new Contract(ADX_STAKING_TOKEN_ADDRESS, ADX_STAKING_POOL_INTERFACE, provider)
                setStakingWalletContract(stakingWalletContract)

                const [timeToUnbond, shareValue, sharesTotalSupply, xWalletBalanceRaw] = await Promise.all([
                    stakingWalletContract.timeToUnbond(),
                    stakingWalletContract.shareValue(),
                    stakingWalletContract.totalSupply(),
                    stakingWalletContract.balanceOf(accountId),
                ])
                
                setShareValue(shareValue)
                setXWalletBalanceRaw(xWalletBalanceRaw)

                const leaveLogs = await provider.getLogs({
                    fromBlock: 0,
                    ...stakingWalletContract.filters.LogLeave(accountId, null, null, null)
                })

                const [log]= leaveLogs.sort((a, b) => b.blockNumber - a.blockNumber)
                
                if (log) {
                    const userLeaves = stakingWalletContract.interface.parseLog(log)
                    const { maxTokens, shares, unlocksAt } = userLeaves.args
                    
                    const walletValue = sharesTotalSupply.isZero()
                        ? ZERO
                        : await stakingWalletContract.unbondingCommitmentWorth(
                            accountId,
                            shares,
                            unlocksAt
                        )

                    setLeaveLog({
                        tokens: maxTokens,
                        shares,
                        unlocksAt,
                        walletValue: utils.formatUnits(walletValue.toString(), 18)
                    })
                
                    const { timestamp } = await provider.getBlock(log.blockNumber)
                    let remainingTime = (timeToUnbond.toString() * 1000) - (Date.now() - (timestamp * 1000))
                    if (remainingTime <= 0) remainingTime = 0
                    setLockedRemainingTime(remainingTime)    
                }
            } catch(e) {
                console.error(e)
            }
        }
        init()
        return () => {
            setShareValue(ZERO)
        }
    }, [networkId, accountId])

    useEffect(() => setLoading(false), [])

    return (
        <Card
            loading={loading || (!xWalletBalanceRaw && !unavailable)}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            customInfo={customInfo}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
            moreDetails={!unavailable && <WalletEarnDetailsModal 
                apy={walletTokenAPY}
                accountId={accountId}
                msToDaysHours={msToDaysHours}
            />}
        />
    )
}

export default WalletTokenCard
