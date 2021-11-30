import './Transfer.scss'

import { useParams, withRouter } from 'react-router'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import NoFundsPlaceholder from './NoFundsPlaceholder/NoFundsPlaceholder'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from '../../../hooks/toasts'
import { TextInput, NumberInput, Button, Select, Loading, AddressBook, AddressWarning } from '../../common'
import { isValidAddress, isKnownTokenOrContract } from '../../../helpers/address';
import CrossChain from './CrossChain/CrossChain'

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
        setDisabled(isKnownTokenOrContract(address) || !isValidAddress(address) || !(amount > 0) || !(amount <= selectedAsset?.balance) || address === selectedAcc || (!isKnownAddress(address) && !addressConfirmed))
    }, [address, amount, selectedAcc, selectedAsset, addressConfirmed, isKnownAddress])

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
                                <div className="separator"/>
                                <AddressWarning
                                    address={address}
                                    onAddNewAddress={() => setNewAddress(address)}
                                    onChange={(value) => setAddressConfirmed(value)}
                                    isKnownAddress={isKnownAddress}
                                />
                                <Button disabled={disabled} onClick={sendTx}>Send</Button>
                            </div>
                            :
                            <NoFundsPlaceholder/>
               }
           </div>
           <CrossChain portfolio={portfolio} network={selectedNetwork}/>
        </div>
    )
}

export default withRouter(Transfer)
