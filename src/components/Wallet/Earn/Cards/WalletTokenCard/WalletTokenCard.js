import { useState, useCallback, useMemo } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { useEffect } from "react"
import { MdInfo } from "react-icons/md"
import { ToolTip, Button } from "components/common"
import { BigNumber, constants, Contract } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import { formatUnits, Interface, parseUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'

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
    const [lockedRemainingTime, setLockedRemainingTime] = useState(0)

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = useCallback((id, txn, extraGas = 0) => 
        addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    , [networkDetails.chainId, accountId, addRequest])

    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.walletTokenAPY * 100).toFixed(2) : 0

    const walletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS), [tokens])
    const xWalletToken = useMemo(() => tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS), [tokens])

    const tokensItems = useMemo(() => [
        {
            type: 'deposit',
            icon: 'https://assets.coingecko.com/coins/images/23154/small/wallet.PNG?1643352408',
            label: 'WALLET',
            value: WALLET_TOKEN_ADDRESS,
            symbol: 'WALLET',
            balance: walletToken?.balance || 0,
            balanceRaw: walletToken?.balanceRaw || 0,
        },
        {
            type: 'withdraw',
            icon: 'https://assets.coingecko.com/coins/images/23154/small/wallet.PNG?1643352408',
            label: 'xWALLET',
            value: WALLET_STAKING_ADDRESS,
            symbol: 'xWALLET',
            balance: xWalletToken?.balance - lockedShares.toString || 0,
            balanceRaw: xWalletToken?.balanceRaw ? BigNumber.from(xWalletToken?.balanceRaw).sub(lockedShares) : 0,
        }
    ], [lockedShares, walletToken, xWalletToken])

    const rageLeave = useCallback(() => {
        addRequestTxn(`rage_leave_staking_pool_${Date.now()}`, {
            to: WALLET_STAKING_ADDRESS,
            value: '0x0',
            data: WALLET_STAKING_POOL_INTERFACE.encodeFunctionData('rageLeave', [lockedShares.toHexString(), false])
        })
    }, [lockedShares, addRequestTxn])

    const onTokenSelect = useCallback(tokenAddress => {
        const token = tokensItems.find(({ value }) => value === tokenAddress)
        const lockedSharesXWALLET = formatUnits(lockedShares.toString(), 18)

        if (token && token.type === 'withdraw' && lockedSharesXWALLET > 0) {
            setInfo(<>
                { msToDays(lockedRemainingTime) } days until { lockedSharesXWALLET } xWALLET becomes unlocked.
                <Button clear mini onClick={() => rageLeave()}>RAGE LEAVE</Button>
            </>)
        }
        else setInfo(null)

        setDetails([
            [
                <>
                    Annual Percentage Yield (APY)
                    <ToolTip label="IN ADDITION to what you earn in $WALLETs">
                        <MdInfo/>
                    </ToolTip>
                </>,
                `${walletTokenAPY}%`
            ],
            ['Lock', '20 days'],
            ['Type', 'Variable Rate'],
        ])
    }, [lockedShares, walletTokenAPY, rageLeave, lockedRemainingTime, tokensItems])

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

                const [timeToUnbond, lockedShares] = await Promise.all([
                    stakingWalletContract.timeToUnbond(),
                    stakingWalletContract.lockedShares(accountId)
                ])

                setLockedShares(lockedShares)

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
            loading={loading}
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