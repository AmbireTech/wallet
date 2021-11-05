import './Transfer.scss'

import { AiOutlineArrowDown } from 'react-icons/ai'
import { BsBoxArrowInDown, BsBoxArrowUp } from 'react-icons/bs'
import { TextInput, NumberInput, Segments, Button, Select, Loading } from '../../common'
import { useCallback, useState } from 'react'

const Transfer = ({ portfolio }) => {
    const [asset, setAsset] = useState()
    const [amount, setAmount] = useState(0)

    const assetsItems = portfolio.tokens.map(({ label, symbol, img }) => ({
        label,
        value: symbol,
        icon: img
    }))

    const setMaxAmount = useCallback(() => {
        const { balanceRaw, decimals } = portfolio.tokens.find(({ symbol }) => symbol === asset)
        setAmount(Number(balanceRaw.slice(0, balanceRaw.length - decimals) + '.' + balanceRaw.slice(balanceRaw.length - decimals)))
    }, [portfolio.tokens, asset])

    const segments = [
        {
            value: 'Deposit',
            icon: <BsBoxArrowInDown/>
        },
        {
            value: 'Withdraw',
            icon: <BsBoxArrowUp/>
        }
    ]

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
                        <div className="form">
                            <Select defaultValue={asset} items={assetsItems} onChange={value => setAsset(value)}/>
                            <NumberInput value={amount} min="0" onInput={value => setAmount(value)} button="MAX" onButtonClick={() => setMaxAmount()}/>
                            <TextInput placeholder="Recipient" info="Please double-check the recipient address, blockchain transactions are not reversible."/>
                            <div className="separator"/>
                            <Button>Send</Button>
                        </div>
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
                    <Segments defaultValue={segments[0].value} segments={segments}/>
                    <TextInput placeholder="From"/>
                    <div className="separator">
                        <AiOutlineArrowDown/>
                    </div>
                    <TextInput placeholder="To"/>
                    <Button>Transfer</Button>
                </div>
           </div>
        </div>
    )
}

export default Transfer