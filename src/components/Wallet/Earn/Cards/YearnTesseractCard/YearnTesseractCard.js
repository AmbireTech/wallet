import Card from 'components/Wallet/Earn/Card/Card'

import { useEffect, useState, useMemo, useRef } from 'react'
import { Interface, parseUnits } from 'ethers/lib/utils'
import networks from 'consts/networks'
import YEARN_TESSERACT_VAULT_ABI from 'ambire-common/src/constants/abis/YearnTesseractVaultABI'
import useYearn from './useYearn'
import { useToasts } from 'hooks/toasts'
import { getProvider } from 'ambire-common/src/services/provider'
import AmbireBatcherABI from 'ambire-common/src/constants/abis/AmbireBatcherABI.json'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { constants, Contract } from 'ethers'
import EarnDetailsModal from 'components/Modals/EarnDetailsModal/EarnDetailsModal'
import { rpcProviders } from 'config/providers'

const BATCHER_ADDRESS = '0x460fad03099f67391d84c9cc0ea7aa2457969cea'
const BATCHER_INTERFACE = new Interface(AmbireBatcherABI)
const ERC20_INTERFACE = new Interface(ERC20ABI)
const VaultInterface = new Interface(YEARN_TESSERACT_VAULT_ABI)

const YEARN_DETAILS = {
    title: 'What is Yearn.finance',
    description: 'Yearn.finance is a suite of products in DeFi that provides yield generation, lending aggregation, and more on the blockchain. The protocol is maintained by various independent developers and is governed by YFI holders.'
}

const YearnTesseractCard = ({ networkId, accountId, tokens, addRequest }) => {
    const { addToast } = useToasts()

    const currentNetwork = useRef()
    const [loading, setLoading] = useState([])

    const unavailable = !(networkId === 'ethereum' || networkId === 'fantom' || networkId === 'arbitrum')
    const name = 'Yearn' 
    const networkDetails = networks.find(({ id }) => id === networkId)
    const addRequestTxn = (id, txn, extraGas = 0) => addRequest({ id, dateAdded: new Date().valueOf(), type: 'eth_sendTransaction', chainId: networkDetails.chainId, account: accountId, txn, extraGas })
    const provider = useMemo(() => {
        return (networkDetails.id === 'ethereum')
        ? rpcProviders['ethereum-ambire-earn']
        : getProvider(networkDetails.id)
    }, [networkDetails.id])
    const isDepositsDisabled = (networkId === 'polygon') ? true : false

    const yearn = useYearn({
        tokens,
        provider,
        networkDetails,
        currentNetwork
    })

    const {
        icon,
        loadVaults,
        tokensItems,
        details,
        onTokenSelect
    } = useMemo(() => yearn, [yearn])

    const moreDetails = {
        title: YEARN_DETAILS.title,
        description: YEARN_DETAILS.description
    }

    const onValidate = async (type, value, amount) => {
        const item = tokensItems.find(t => t.type === type.toLowerCase() && t.value === value)
        if (!item) return

        const { tokenAddress, vaultAddress, decimals } = item
        const parsedAmount = amount.slice(0, amount.indexOf('.') + Number(decimals) + 1);
        const bigNumberAmount = parseUnits(parsedAmount, decimals)

        // Transfer funds to batcher
        let transferTx = {
            to: tokenAddress,
            value: '0x0',
            data: ERC20_INTERFACE.encodeFunctionData('transfer', [BATCHER_ADDRESS, bigNumberAmount.toHexString()]),
        }

        if (Number(tokenAddress) === 0) {
            transferTx = {
                to: BATCHER_ADDRESS,
                value: bigNumberAmount.toHexString(),
                data: '0x'
            }
        }

        addRequestTxn(`batcher_call_transfer_funds_${Date.now()}`, transferTx)

        if (type === 'Deposit') {
            try {
                // Build approve and deposit tx for batcher
                let batchCallTxn = []

                const provider = (networkId === 'ethereum')
                    ? rpcProviders['ethereum-ambire-earn']
                    : getProvider(networkId)
                const tokenContract = new Contract(tokenAddress, ERC20_INTERFACE, provider)
                const allowance = await tokenContract.allowance(BATCHER_ADDRESS, vaultAddress)

                if (allowance.lt(constants.MaxUint256)) {
                    batchCallTxn.push({
                        to: tokenAddress,
                        value: '0x0',
                        data: ERC20_INTERFACE.encodeFunctionData('approve', [vaultAddress, constants.MaxUint256])
                    })
                }

                batchCallTxn.push({
                    to: vaultAddress,
                    value: '0x0',
                    data: VaultInterface.encodeFunctionData('deposit', [bigNumberAmount.toHexString(), accountId])
                })
            
                addRequestTxn(`batcher_call_vault_deposit_${Date.now()}`, {
                    to: BATCHER_ADDRESS,
                    value: '0x0',
                    data: BATCHER_INTERFACE.encodeFunctionData('batchCall', [batchCallTxn])
                })
            } catch(e) {
                console.error(e)
                addToast(`${name} Deposit Error: ${e.message || e}`, { error: true })
            }
        } else if (type === 'Withdraw') {
            try {
                const batchCallTxn = [{
                    to: vaultAddress,
                    value: '0x0',
                    data: VaultInterface.encodeFunctionData('withdraw', [bigNumberAmount.toHexString(), accountId])
                }]

                addRequestTxn(`batcher_call_vault_withdraw_${Date.now()}`, {
                    to: BATCHER_ADDRESS,
                    value: '0x0',
                    data: BATCHER_INTERFACE.encodeFunctionData('batchCall', [batchCallTxn])
                })
            } catch(e) {
                console.error(e)
                addToast(`${name} Withdraw Error: ${e.message || e}`, { error: true })
            }
        }
    }

    useEffect(() => {
        if (unavailable) {
		setLoading(false)
		return
	}
        async function load() {
            await loadVaults()
            setLoading(false)
        }
        load()
    }, [unavailable, loadVaults])

    useEffect(() => {
        currentNetwork.current = networkId
        if (!unavailable) setLoading(true)
    }, [networkId, unavailable])

    return (
        <Card
            isDepositsDisabled={isDepositsDisabled}
            loading={loading}
            icon={icon}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
            moreDetails={<EarnDetailsModal 
                title={moreDetails.title}
                description={moreDetails.description}
            />}
        />
    )
}

export default YearnTesseractCard
