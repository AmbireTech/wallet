import './Transfer.scss'

import { BsXLg } from 'react-icons/bs'
import { AiOutlineSend } from 'react-icons/ai'
import { useParams, withRouter } from 'react-router'
import { useEffect, useMemo, useState, useRef } from 'react'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from 'hooks/toasts'
import { TextInput, NumberInput, Button, Select, Loading, AddressBook, AddressWarning, NoFundsPlaceholder, Checkbox, ToolTip } from 'components/common'
import { validateSendTransferAddress, validateSendTransferAmount } from 'lib/validations/formValidations'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { isValidAddress } from 'lib/address'
import Addresses from './Addresses/Addresses'
import { MdInfo } from 'react-icons/md'
import networks from 'consts/networks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))
const unsupportedSWPlatforms = ['Binance', 'Huobi', 'KuCoin', 'Gate.io', 'FTX']

const Transfer = ({ history, portfolio, selectedAcc, selectedNetwork, addRequest, addressBook }) => {
    const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook

    const { tokenAddressOrSymbol } = useParams()
    const { addToast } = useToasts()

    const tokenAddress = isValidAddress(tokenAddressOrSymbol) ? tokenAddressOrSymbol : portfolio.tokens.find(({ symbol }) => symbol === tokenAddressOrSymbol)?.address || null

    const [asset, setAsset] = useState(tokenAddress)
    const [amount, setAmount] = useState(0)
    const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')
    const [address, setAddress] = useState('')
    const [uDAddress, setUDAddress] = useState('')
    const [disabled, setDisabled] = useState(true)
    const [addressConfirmed, setAddressConfirmed] = useState(false)
    const [sWAddressConfirmed, setSWAddressConfirmed] = useState(false)
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
    const timer = useRef(null)
    const assetsItems = portfolio.tokens.map(({ label, symbol, address, img, tokenImageUrl, network }) => ({
        label: label || symbol,
        value: address,
        icon: img || tokenImageUrl,
        fallbackIcon: getTokenIcon(network, address)
    }))

    const selectedAsset = portfolio.tokens.find(({ address }) => address === asset)

    const { maxAmount, maxAmountFormatted } = useMemo(() => {
        if (!selectedAsset) return {maxAmount: '0', maxAmountFormatted: '0.00'};
        const { balanceRaw, decimals, balance } = selectedAsset
        return {
            maxAmount: ethers.utils.formatUnits(balanceRaw, decimals),
            maxAmountFormatted:  formatFloatTokenAmount(balance, true, decimals)
        }
    }, [selectedAsset])

    const showSWAddressWarning = useMemo(() => 
        Number(tokenAddress) === 0 && networks.map(({ id }) => id).filter(id => id !== 'ethereum').includes(selectedNetwork.id)
    , [tokenAddress, selectedNetwork])

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
        const recipientAddress = uDAddress ? uDAddress : address

        try {
            const txn = {
                to: selectedAsset.address,
                value: '0',
                data: ERC20.encodeFunctionData('transfer', [recipientAddress, bigNumberHexAmount])
            }

            if (Number(selectedAsset.address) === 0) {
                txn.to = recipientAddress
                txn.value = bigNumberHexAmount
                txn.data = '0x'
            }

            let req = {
                id: `transfer_${Date.now()}`,
                type: 'eth_sendTransaction',
                chainId: selectedNetwork.chainId,
                account: selectedAcc,
                txn,
                meta: null
            }

            if (uDAddress) {
                req.meta = { 
                    addressLabel: { 
                        addressLabel: address,
                        address: uDAddress
                    }
                }
            }
             
            addRequest(req)

            setAmount(0)
        } catch(e) {
            console.error(e)
            addToast(`Error: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => {
        setAmount(0)
        setBigNumberHexAmount('')
        setSWAddressConfirmed(false)
    }, [asset, selectedNetwork.id])

    useEffect(() => {
        if (!selectedAsset) return
        history.replace({ pathname: `/wallet/transfer/${Number(asset) !== 0 ? asset : selectedAsset.symbol}` })
    }, [asset, history, selectedAsset])

    useEffect(() => {
        const isValidSendTransferAmount = validateSendTransferAmount(amount, selectedAsset)

        if (address.startsWith('0x') && (address.indexOf('.') === -1)) {
            if (uDAddress !== '') setUDAddress('')
            const isValidRecipientAddress = validateSendTransferAddress(address, selectedAcc, addressConfirmed, isKnownAddress)
            
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

            setDisabled(!isValidRecipientAddress.success || !isValidSendTransferAmount.success || (showSWAddressWarning && !sWAddressConfirmed))
        } else {
            if (timer.current) {
                clearTimeout(timer.current)
            }

            const validateForm = async() => {
                const UDAddress =  await resolveUDomain(address, selectedAsset ? selectedAsset.symbol: null, selectedNetwork.unstoppableDomainsChain)
                timer.current = null
                const isUDAddress = UDAddress ? true : false
                const isValidRecipientAddress = validateSendTransferAddress(UDAddress ? UDAddress : address, selectedAcc, addressConfirmed, isKnownAddress, isUDAddress)
                
                setUDAddress(UDAddress)
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
    
                setDisabled(!isValidRecipientAddress.success || !isValidSendTransferAmount.success || (showSWAddressWarning && !sWAddressConfirmed))
            }

            timer.current = setTimeout(async() => {
                return validateForm().catch(console.error)
            }, 300)
        }
        return () => clearTimeout(timer.current)
    }, [address, amount, selectedAcc, selectedAsset, addressConfirmed, showSWAddressWarning, sWAddressConfirmed, isKnownAddress, addToast, selectedNetwork, addAddress, uDAddress])

    const amountLabel = <div className="amount-label">Available Amount: <span>{ maxAmountFormatted } { selectedAsset?.symbol }</span></div>

    return (
        <div id="transfer">
           <div className="panel">
               <div className="title">
                   Send
               </div>
               {
                    portfolio.isCurrNetworkBalanceLoading ?
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
                                    <ToolTip label={!uDAddress ? 'You can use Unstoppable domainsⓇ' : 'Valid Unstoppable domainsⓇ domain'}>
                                        <div id="udomains-logo" className={uDAddress ? 'ud-logo-active ' : ''} />
                                    </ToolTip>
                                    <AddressBook 
                                        addresses={addresses.filter(x => x.address !== selectedAcc)}
                                        addAddress={addAddress}
                                        removeAddress={removeAddress}
                                        newAddress={newAddress}
                                        onClose={() => setNewAddress(null)}
                                        onSelectAddress={address => setAddress(address)}
                                        selectedNetwork={selectedNetwork}
                                    />
                                </div>
                                { validationFormMgs.messages.address && 
                                    (<div className='validation-error'><BsXLg size={12}/>&nbsp;{validationFormMgs.messages.address}</div>)}
                                <div className="separator"/>
                                <AddressWarning
                                    address={uDAddress ? uDAddress : address}
                                    onAddNewAddress={() => setNewAddress(uDAddress ? uDAddress : address)}
                                    onChange={(value) => setAddressConfirmed(value)}
                                    isKnownAddress={isKnownAddress}
                                />
                                {
                                    showSWAddressWarning ? 
                                        <Checkbox 
                                            id="binance-address-warning"
                                            label={<span id="binance-address-warning-label">
                                                I confirm this address is not a { unsupportedSWPlatforms.join(' / ') } address: <br/>
                                                These platforms do not support ${selectedAsset?.symbol} deposits from smart wallets
                                                <a href='https://help.ambire.com/hc/en-us/articles/4415473743506-Statement-on-MATIC-BNB-deposits-to-Binance' target='_blank' rel='noreferrer'><MdInfo size={20}/></a>
                                            </span>}
                                            checked={sWAddressConfirmed}
                                            onChange={({ target }) => setSWAddressConfirmed(target.checked)}
                                        />
                                        :
                                        null
                                }
                                <Button icon={<AiOutlineSend/>} disabled={disabled} onClick={sendTx}>Send</Button>
                            </div>
                            :
                            <NoFundsPlaceholder/>
               }
           </div>
           <Addresses
                selectedAsset={selectedAsset}
                selectedNetwork={selectedNetwork}
                addresses={addresses}
                addAddress={addAddress}
                removeAddress={removeAddress}
                onSelectAddress={address => setAddress(address)}
            />
        </div>
    )
}

export default withRouter(Transfer)
