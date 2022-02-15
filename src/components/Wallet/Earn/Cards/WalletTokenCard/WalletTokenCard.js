import { useState, useCallback, useMemo } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { useEffect } from "react"
import { MdInfo } from "react-icons/md"
import { ToolTip, NumberInput, Button } from "components/common"
import { BigNumber, constants, Contract } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import { formatUnits, Interface, parseUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'
import { BsArrowUpSquare } from "react-icons/bs"

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'
const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)

const msToDaysHours = ms => {
    const day = 24 * 60 * 60 * 1000
    const days = Math.floor(ms / day)
    const hours = Math.floor((ms % day) / (60 * 60 * 1000))
    return days < 1 ? `${hours} hours` : `${days} days`
};

const WalletTokenCard = ({ networkId, accountId, tokens, rewardsData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])
    const [customInfo, setCustomInfo] = useState(null)
    const [stakingWalletContract, setStakingWalletContract] = useState(null)
    const [lockedShares, setLockedShares] = useState(BigNumber.from(0))
    const [shareValue, setShareValue] = useState(BigNumber.from(0))
    const [lockedRemainingTime, setLockedRemainingTime] = useState(0)
    const [leaveLog, setLeaveLog] = useState(null)

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) => 
        addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    , [networkDetails.chainId, accountId, addRequest])

    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.xWALLETAPY * 100).toFixed(2) : 0

    const walletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS), [tokens])
    const xWalletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS), [tokens])

    const tokensItems = useMemo(() => [
        {
            type: 'deposit',
            icon: 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png',
            label: 'WALLET',
            value: WALLET_TOKEN_ADDRESS,
            symbol: 'WALLET',
            balance: walletToken?.balance || 0,
            balanceRaw: walletToken?.balanceRaw || 0,
        },
        {
            type: 'withdraw',
            icon: 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/xwallet_250x250.png',
            label: 'xWALLET',
            value: WALLET_STAKING_ADDRESS,
            symbol: 'xWALLET',
            balance: xWalletToken?.balance || 0,
            balanceRaw: xWalletToken?.balanceRaw || 0,
        }
    ], [walletToken, xWalletToken])

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
        if (token && token.type === 'withdraw' && leaveLog && lockedShares.gt(0) && shareValue.gt(0)) {
            const lockedWalletAmount = formatUnits(lockedShares.toString(), 18).toString() * formatUnits(shareValue, 18).toString()

            setCustomInfo(
                <>
                    <NumberInput
                        value={lockedWalletAmount}
                        label="Pending to be unlocked:"
                    />
                    <div className="info-message">
                        <b>{ msToDaysHours(lockedRemainingTime) }</b> until { lockedWalletAmount } WALLET becomes available for withdraw.
                    </div>
                    <div className="separator"></div>
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
                    Annual Percentage Yield (APY)
                    <ToolTip label="IN ADDITION to what you earn in $WALLETs">
                        <MdInfo/>
                    </ToolTip>
                </>,
                rewardsData.isLoading ? `...` : `${walletTokenAPY}%`
            ],
            ['Lock', '20 day unbond period'],
            ['Type', 'Variable Rate'],
        ])
    }, [lockedShares, shareValue, walletTokenAPY, rewardsData.isLoading, lockedRemainingTime, tokensItems, leaveLog, onWithdraw])

    const onValidate = async (type, value, amount) => {
        const bigNumberAmount = parseUnits(amount, 18)

        if (type === 'Deposit') {
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
            addRequestTxn(`leave_staking_pool_${Date.now()}`, {
                to: WALLET_STAKING_ADDRESS,
                value: '0x0',
                data: WALLET_STAKING_POOL_INTERFACE.encodeFunctionData('leave', [bigNumberAmount.toHexString(), false])
            })
        }
    }

    useEffect(() => {
        async function init() {
            try {
                const provider = getProvider(networkId)
                const stakingWalletContract = new Contract(WALLET_STAKING_ADDRESS, WALLET_STAKING_POOL_INTERFACE, provider)
                setStakingWalletContract(stakingWalletContract)

                const [timeToUnbond, lockedShares, shareValue] = await Promise.all([
                    stakingWalletContract.timeToUnbond(),
                    stakingWalletContract.lockedShares(accountId),
                    stakingWalletContract.shareValue()
                ])

                setLockedShares(lockedShares)
                setShareValue(shareValue)

                const [log] = await provider.getLogs({
                    fromBlock: 0,
                    ...stakingWalletContract.filters.LogLeave()
                })

                if (log) {
                    const { maxTokens, shares, unlocksAt } = stakingWalletContract.interface.parseLog(log).args
                    setLeaveLog({
                        tokens: maxTokens,
                        shares,
                        unlocksAt
                    })
    
                    const { timestamp } = await provider.getBlock(log.blockNumber)
                    const remainingTime = (timeToUnbond.toString() * 1000) - (Date.now() - (timestamp * 1000))
                    setLockedRemainingTime(remainingTime)
                }
            } catch(e) {
                console.error(e)
            }
        }
        init()
    }, [networkId, accountId])

    useEffect(() => setLoading(false), [])

    return (
        <Card
            loading={loading}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            customInfo={customInfo}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default WalletTokenCard