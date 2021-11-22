import './Transfer.scss'

import { AiOutlineWarning } from 'react-icons/ai'
import { BsArrowDown } from 'react-icons/bs'
import { useParams, withRouter } from 'react-router'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import SendPlaceholder from './SendPlaceholder/SendPlaceholder'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from '../../../hooks/toasts'
import { TextInput, NumberInput, Button, Select, Loading, AddressBook, UnknownAddress } from '../../common'
import { names, tokens } from '../../../consts/humanizerInfo'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))
const crossChainAssets = [
    {
        label: 'USD Coin (Polygon)',
        value: 'USDC-polygon',
        icon: 'https://raw.githubusercontent.com/sushiswap/assets/master/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png'
    },
    {
        label: 'Tether USD (Polygon)',
        value: 'USDT-polygon',
        icon: 'https://raw.githubusercontent.com/sushiswap/assets/master/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo.png'
    }
]

const Transfer = ({ history, portfolio, selectedAcc, selectedNetwork, addRequest, addresses, addAddress, removeAddress, isKnownAddress, isValidAddress }) => {
    const { tokenAddress } = useParams()
    const { addToast } = useToasts()

    const [asset, setAsset] = useState(tokenAddress)
    const [amount, setAmount] = useState(0)
    const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')
    const [address, setAddress] = useState('')
    const [disabled, setDisabled] = useState(true)
    const [warning, setWarning] = useState(false)
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [newAddress, setNewAddress] = useState('')

    const assetsItems = portfolio.tokens.map(({ label, address, img }) => ({
        label,
        value: address,
        icon: img
    }))

    const selectedAsset = portfolio.tokens.find(({ address }) => address === asset)

    const getMaxAmount = () => {
        if (!selectedAsset) return 0;
        const { balanceRaw, decimals } = selectedAsset
        return ethers.utils.formatUnits(balanceRaw, decimals)
    }

    const setMaxAmount = () => onAmountChange(getMaxAmount(amount))

    const onAmountChange = value => {
        if (value) {
            const { decimals } = selectedAsset
            const bigNumberAmount = ethers.utils.parseUnits(value, decimals).toHexString()
            setBigNumberHexAmount(bigNumberAmount)
        }

        setAmount(value)
    }

    const sendTx = () => {
        try {
            const txn = {
                to: tokenAddress,
                value: '0',
                data: ERC20.encodeFunctionData('transfer', [address, bigNumberHexAmount])
            }

            if (Number(tokenAddress) === 0) {
                txn.to = address
                txn.value = bigNumberHexAmount
                txn.data = '0x'
            }

            addRequest({
                id: `transfer_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: selectedNetwork.chainId,
                account: selectedAcc,
                txn
            })

            setAmount(0)
        } catch(e) {
            console.error(e)
            addToast(`Error: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => {
        setAmount(0)
        setBigNumberHexAmount('')
        history.replace({ pathname: `/wallet/transfer/${asset}` })
    }, [asset, history])

    useEffect(() => {
        const addressToLowerCase = address.toLowerCase()
        const tokensAddresses = Object.keys(tokens)
        const contractsAddresses = Object.keys(names)
        const isKnowTokenOrContract = tokensAddresses.includes(addressToLowerCase) || contractsAddresses.includes(addressToLowerCase)

        setWarning(isKnowTokenOrContract)
        setDisabled(isKnowTokenOrContract || !isValidAddress(address) || !(amount > 0) || !(amount <= selectedAsset?.balance) || address === selectedAcc || (!isKnownAddress(address) && !addressConfirmed))
    }, [address, amount, selectedAcc, selectedAsset, addressConfirmed, isValidAddress, isKnownAddress])

    return (
        <div id="transfer">
           <div className="panel">
               <div className="title">
                   Send
               </div>
               {
                    portfolio.isBalanceLoading ?
                        <Loading/>
                        :
                        assetsItems.length ? 
                            <div className="form">
                                <Select searchable defaultValue={asset} items={assetsItems} onChange={(value) => setAsset(value)}/>
                                <NumberInput
                                    label={`Available Amount: ${getMaxAmount()} ${selectedAsset?.symbol}`}
                                    value={amount}
                                    precision={selectedAsset?.decimals}
                                    onInput={onAmountChange}
                                    button="MAX"
                                    onButtonClick={() => setMaxAmount()}
                                />
                                <div id="recipient-field">
                                    <TextInput
                                        placeholder="Recipient"
                                        info="Please double-check the recipient address, blockchain transactions are not reversible."
                                        value={address}
                                        onInput={setAddress}
                                    />
                                    <AddressBook 
                                        addresses={addresses}
                                        addAddress={addAddress}
                                        removeAddress={removeAddress}
                                        newAddress={newAddress}
                                        onClose={() => setNewAddress(null)}
                                        onSelectAddress={address => setAddress(address)}
                                    />
                                </div>
                                <UnknownAddress
                                    address={address}
                                    onAddNewAddress={() => setNewAddress(address)}
                                    onChange={(value) => setAddressConfirmed(value)}
                                    isKnownAddress={isKnownAddress}
                                    isValidAddress={isValidAddress}
                                />
                                <div className="separator"/>
                                {
                                    warning ?
                                        <div id="address-warning">
                                            <AiOutlineWarning/>
                                            You are trying to send tokens to a smart contract. Doing so would burn them.
                                        </div>
                                        :
                                        null
                                }
                                <Button disabled={disabled} onClick={sendTx}>Send</Button>
                            </div>
                            :
                            <SendPlaceholder/>
               }
           </div>
           <div className="panel">
               <div className="placeholder-overlay">
                    Coming Soon...
               </div>
               <div className="title blurred">
                   Cross-chain
               </div>
               <div className="form blurred">
                    <label>From</label>
                    <Select searchable items={assetsItems} onChange={() => {}}/>
                    <NumberInput value={0} min="0" onInput={() => {}} button="MAX" onButtonClick={() => setMaxAmount()}/>
                    <div className="separator">
                        <BsArrowDown/>
                    </div>
                    <label>To</label>
                    <Select searchable items={crossChainAssets} onChange={() => {}}/>
                    <NumberInput value={0} min="0" onInput={() => {}} button="MAX" onButtonClick={() => {}}/>
                    <Button>Transfer</Button>
                </div>
           </div>
        </div>
    )
}

export default withRouter(Transfer)
