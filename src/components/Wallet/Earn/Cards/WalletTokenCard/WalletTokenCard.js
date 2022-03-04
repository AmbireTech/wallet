import { useState, useCallback, useMemo } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { useEffect } from "react"
import { MdInfo } from "react-icons/md"
import { ToolTip, NumberInput } from "components/common"
import { BigNumber, constants, Contract } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import { Interface, parseUnits, formatUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'
import { getTokenIcon } from 'lib/icons'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935'
const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)

const msToDays = ms => Math.floor(ms / (24 * 60 * 60 * 1000));

const WalletTokenCard = ({ networkId, accountId, tokens, rewardsData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])
    const [info, setInfo] = useState(null)
    const [stakingWalletContract, setStakingWalletContract] = useState(null)
    const [lockedShares, setLockedShares] = useState(BigNumber.from(0))
    const [shareValue, setShareValue] = useState(BigNumber.from(0))
    const [xWalletBalanceRaw, setXWalletBalanceRaw] = useState(null)
    const [lockedRemainingTime, setLockedRemainingTime] = useState(0)

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) =>
        addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    , [networkDetails.chainId, accountId, addRequest])

    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.xWALLETAPY * 100).toFixed(2) : 0

    const walletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS), [tokens])
    const xWalletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS), [tokens])

    const balanceRaw = useMemo(() => xWalletBalanceRaw ? (BigNumber.from(xWalletBalanceRaw).mul(shareValue)).div(BigNumber.from((1e18).toString())).toString() : 0,
      [xWalletBalanceRaw, shareValue])

    const tokensItems = useMemo(() => [
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
            icon: getTokenIcon(networkId, WALLET_STAKING_ADDRESS),
            label: 'WALLET',
            value: WALLET_STAKING_ADDRESS,
            symbol: 'WALLET',
            balance: formatUnits(balanceRaw, xWalletToken?.decimals),
            balanceRaw,
        }
    ], [walletToken, xWalletToken, balanceRaw, networkId])

    const onTokenSelect = useCallback(tokenAddress => {
        setInfo(null)

        const token = tokensItems.find(({ value }) => value === tokenAddress)
        if (lockedShares.gt(0) && shareValue.gt(0)) {
            const lockedWalletAmount = lockedShares.div(shareValue).mul(100)

            if (token && token.type === 'withdraw' && lockedWalletAmount.gt(0)) {
                setInfo(
                    <>
                        <NumberInput
                            value={lockedWalletAmount.toString()}
                            label="Pending to be unlocked:"
                        />
                        <div className="info-message">
                            <b>{ msToDays(lockedRemainingTime) } days</b> until { lockedWalletAmount.toString() } WALLET becomes available for withdraw.
                        </div>
                    </>
                )
            }
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
    }, [lockedShares, shareValue, walletTokenAPY, rewardsData.isLoading, lockedRemainingTime, tokensItems])

    const onValidate = async (type, value, amount, isMaxAmount) => {
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
            let xWalletAmount

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
                const stakingWalletContract = new Contract(WALLET_STAKING_ADDRESS, WALLET_STAKING_POOL_INTERFACE, provider)
                setStakingWalletContract(stakingWalletContract)

                const [timeToUnbond, lockedShares, shareValue, xWalletBalanceRaw] = await Promise.all([
                    stakingWalletContract.timeToUnbond(),
                    stakingWalletContract.lockedShares(accountId),
                    stakingWalletContract.shareValue(),
                    stakingWalletContract.balanceOf(accountId),
                ])

                setLockedShares(lockedShares)
                setShareValue(shareValue)
                setXWalletBalanceRaw(xWalletBalanceRaw)

                const [log] = await provider.getLogs({
                    fromBlock: 0,
                    ...stakingWalletContract.filters.LogLeave(accountId, null, null, null)
                })

                if (log) {
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
            loading={loading || (!xWalletBalanceRaw && !unavailable)}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            info={info}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default WalletTokenCard
