import './Transfer.scss'

import { BsXLg } from 'react-icons/bs'
import { AiOutlineSend } from 'react-icons/ai'
import { useParams, withRouter } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from '../../../hooks/toasts'
import { TextInput, NumberInput, Button, Select, Loading, AddressBook, AddressWarning, NoFundsPlaceholder } from '../../common'
import { validateSendTransferAddress, validateSendTransferAmount } from '../../../lib/validations/formValidations'
import Addresses from './Addresses/Addresses'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))

const Transfer = ({ history, portfolio, selectedAcc, selectedNetwork, addRequest, addressBook }) => {
    const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook

    const { tokenAddress } = useParams()
    const { addToast } = useToasts()

    const [asset, setAsset] = useState(tokenAddress)
    const [amount, setAmount] = useState(0)
    const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')
    const [address, setAddress] = useState('')
    const [disabled, setDisabled] = useState(true)
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [newAddress, setNewAddress] = useState('')
    const [validationFormMgs, setValidationFormMgs] = useState({ 
        success: { 
            amount: false,
            address: false
        }, 
        messages: { 
            amount: '', 
            address: ''
        }
    })

    const assetsItems = portfolio.tokens.map(({ label, symbol, address, img, tokenImageUrl }) => ({
        label: label || symbol,
        value: address,
        icon: img || tokenImageUrl
    }))

    const selectedAsset = portfolio.tokens.find(({ address }) => address === asset)

    const maxAmount = useMemo(() => {
        if (!selectedAsset) return 0;
        const { balanceRaw, decimals } = selectedAsset
        return ethers.utils.formatUnits(balanceRaw, decimals)
    }, [selectedAsset])

    const setMaxAmount = () => onAmountChange(maxAmount)

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
        const isValidRecipientAddress = validateSendTransferAddress(address, selectedAcc, addressConfirmed, isKnownAddress)
        const isValidSendTransferAmount = validateSendTransferAmount(amount, selectedAsset) 
       
        setValidationFormMgs({ 
            success: { 
                amount: isValidSendTransferAmount.success, 
                address: isValidRecipientAddress.success 
            }, 
            messages: { 
                amount: isValidSendTransferAmount.message ?  isValidSendTransferAmount.message : '',
                address: isValidRecipientAddress.message ? isValidRecipientAddress.message : ''
            }
        })

        setDisabled(!(isValidRecipientAddress.success && isValidSendTransferAmount.success))
    }, [address, amount, selectedAcc, selectedAsset, addressConfirmed, isKnownAddress, addToast])

    const amountLabel = <div className="amount-label">Available Amount: <span>{ maxAmount } { selectedAsset?.symbol }</span></div>

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
                                    label={amountLabel}
                                    value={amount}
                                    precision={selectedAsset?.decimals}
                                    onInput={onAmountChange}
                                    button="MAX"
                                    onButtonClick={() => setMaxAmount()}
                                />
                                { validationFormMgs.messages.amount && 
                                    (<div className='validation-error'><BsXLg size={12}/>&nbsp;{validationFormMgs.messages.amount}</div>)}
                                <div id="recipient-field">
                                    <TextInput
                                        placeholder="Recipient"
                                        info="Please double-check the recipient address, blockchain transactions are not reversible."
                                        value={address}
                                        onInput={setAddress}
                                    />
                                    <AddressBook 
                                        addresses={addresses.filter(x => x.address !== selectedAcc)}
                                        addAddress={addAddress}
                                        removeAddress={removeAddress}
                                        newAddress={newAddress}
                                        onClose={() => setNewAddress(null)}
                                        onSelectAddress={address => setAddress(address)}
                                    />
                                </div>
                                { validationFormMgs.messages.address && 
                                    (<div className='validation-error'><BsXLg size={12}/>&nbsp;{validationFormMgs.messages.address}</div>)}
                                <div className="separator"/>
                                <AddressWarning
                                    address={address}
                                    onAddNewAddress={() => setNewAddress(address)}
                                    onChange={(value) => setAddressConfirmed(value)}
                                    isKnownAddress={isKnownAddress}
                                />
                                <Button icon={<AiOutlineSend/>} disabled={disabled} onClick={sendTx}>Send</Button>
                            </div>
                            :
                            <NoFundsPlaceholder/>
               }
           </div>
           <Addresses
                addresses={addresses}
                addAddress={addAddress}
                removeAddress={removeAddress}
            />
        </div>
    )
}

export default withRouter(Transfer)
