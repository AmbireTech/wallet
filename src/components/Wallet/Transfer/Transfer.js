import './Transfer.scss'

import { BsArrowDown } from 'react-icons/bs'
import { TextInput, NumberInput, Button, Select, Loading } from '../../common'
import { useCallback, useEffect, useState } from 'react'
import SendPlaceholder from './SendPlaceholder/SendPlaceholder'

const Transfer = ({ portfolio }) => {
    const [asset, setAsset] = useState()
    const [amount, setAmount] = useState(0)
    const [address, setAddress] = useState()
    const [disabled, setDisabled] = useState(true)

    const assetsItems = portfolio.balance.tokens.map(({ label, symbol, img }) => ({
        label,
        value: symbol,
        icon: img
    }))

    const setMaxAmount = useCallback(() => {
        const { balanceRaw, decimals } = portfolio.balance.tokens.find(({ symbol }) => symbol === asset)
        setAmount(Number(balanceRaw / `1e${decimals}`))
    }, [portfolio.tokens, asset])

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

    useEffect(() => setAmount(0), [asset])

    useEffect(() => {
        const isAddressValid = /^0x[a-fA-F0-9]{40}$/.test(address)
        setDisabled(!isAddressValid || !(amount > 0))
    }, [address, amount])

    return (
        <div id="transfer">
           <div className="panel">
               <div className="title">
                   Send
               </div>
               {
                    portfolio.isLoading ?
                        <Loading/>
                        :
                        assetsItems.length ? 
                            <div className="form">
                                <Select searchable defaultValue={asset} items={assetsItems} onChange={value => setAsset(value)}/>
                                <NumberInput value={amount} min="0" onInput={value => setAmount(value)} button="MAX" onButtonClick={() => setMaxAmount()}/>
                                <TextInput
                                    placeholder="Recipient"
                                    info="Please double-check the recipient address, blockchain transactions are not reversible."
                                    defaultValue={address}
                                    onInput={setAddress}
                                />
                                <div className="separator"/>
                                <Button disabled={disabled}>Send</Button>
                            </div>
                            :
                            <SendPlaceholder/>
               }
           </div>
           <div className="panel">
               <div className="overlay">
                    Coming Soon...
               </div>
               <div className="title">
                   Cross-chain
               </div>
               <div className="form">
                    <label>From</label>
                    <Select searchable defaultValue={asset} items={assetsItems} onChange={value => setAsset(value)}/>
                    <NumberInput value={amount} min="0" onInput={value => setAmount(value)} button="MAX" onButtonClick={() => setMaxAmount()}/>
                    <div className="separator">
                        <BsArrowDown/>
                    </div>
                    <label>To</label>
                    <Select searchable defaultValue={asset} items={crossChainAssets} onChange={() => {}}/>
                    <NumberInput value={0} min="0" onInput={() => {}} button="MAX" onButtonClick={() => {}}/>
                    <Button>Transfer</Button>
                </div>
           </div>
        </div>
    )
}

export default Transfer