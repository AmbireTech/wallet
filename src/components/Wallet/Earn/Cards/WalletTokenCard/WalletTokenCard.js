import { useState, useCallback } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { useEffect } from "react"
import { MdInfo } from "react-icons/md"
import { ToolTip } from "components/common"
import { constants, Contract } from "ethers"
import WalletStakingPoolABI from 'consts/WalletStakingPoolABI'
import { Interface, parseUnits } from "ethers/lib/utils"
import { getProvider } from 'lib/provider'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import networks from 'consts/networks'

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'
const WALLET_STAKING_ADDRESS = '0x4d3348aa74ba11a2722ea9adec6bc10e92fe3d58'
const WALLET_STAKING_POOL_INTERFACE = new Interface(WalletStakingPoolABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)

const WalletTokenCard = ({ networkId, accountId, tokens, rewardsData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])

    const provider = getProvider(networkId)
    const stakingWalletContract = new Contract(WALLET_STAKING_ADDRESS, WALLET_STAKING_POOL_INTERFACE, provider)

    const unavailable = networkId !== 'ethereum'
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })

    const walletTokenAPY = !rewardsData.isLoading && rewardsData.data ? (rewardsData.data?.walletTokenAPY * 100).toFixed(2) : 0

    const walletToken = tokens.find(({ address }) => address === WALLET_TOKEN_ADDRESS)
    const xWalletToken = tokens.find(({ address }) => address === WALLET_STAKING_ADDRESS)

    const depositItems = [{
        type: 'deposit',
        icon: 'https://assets.coingecko.com/coins/images/23154/small/wallet.PNG?1643352408',
        label: 'WALLET',
        value: WALLET_TOKEN_ADDRESS,
        symbol: 'WALLET',
        balance: walletToken?.balance || 0,
        balanceRaw: walletToken?.balanceRaw || 0,
    }]

    const withdrawItems = [{
        type: 'withdraw',
        icon: 'https://assets.coingecko.com/coins/images/23154/small/wallet.PNG?1643352408',
        label: 'WALLET-STAKING',
        value: WALLET_STAKING_ADDRESS,
        symbol: 'WALLET-STAKING',
        balance: xWalletToken?.balance || 0,
        balanceRaw: xWalletToken?.balanceRaw || 0,
    }]

    const tokensItems = [
        ...depositItems,
        ...withdrawItems
    ]

    const onTokenSelect = useCallback(() => {
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
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [walletTokenAPY])

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

    useEffect(() => setLoading(false), [])

    return (
        <Card
            loading={loading}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default WalletTokenCard