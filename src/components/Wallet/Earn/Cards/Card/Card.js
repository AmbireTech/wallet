import './Card.scss'

import { Select, Segments, NumberInput, Button, Loading } from '../../../../common'
import { useEffect, useState } from 'react'

const segments = [{ value: 'Deposit' }, { value: 'Withdraw' }]

const Card = ({ loading, tokensItems, icon, details, onTokenSelect, onValidate }) => {    
    const [segment, setSegment] = useState(segments[0].value)
    const [tokens, setTokens] = useState([])
    const [token, setToken] = useState()
    const [amount, setAmount] = useState(0)
    const [disabled, setDisabled] = useState(true)

    const currentToken = tokens.find(({ value }) => value === token)

    const setMaxValue = () => setAmount(currentToken?.balance)

    useEffect(() => {
        setAmount(0)
        if (segment === segments[0].value) setTokens(tokensItems.filter(({ type }) => type === 'deposit'))
        if (segment === segments[1].value) setTokens(tokensItems.filter(({ type }) => type === 'withdraw'))
    }, [segment, tokensItems])

    useEffect(() => {
        onTokenSelect(token)
        setDisabled(!token || !tokens.length)
    }, [token, onTokenSelect, tokens.length])

    return (
        <div className="card">
            <div className="title">
                <img src={icon} alt="Icon" />
            </div>
            {
                loading ?
                    <Loading/>
                    :
                    <div className="content">
                        <Select searchable disabled={disabled} label="Choose Token" defaultValue={token} items={tokens} onChange={(value) => setToken(value)}/>
                        {
                            !disabled ? 
                                <ul className="details">
                                    {
                                        details.map(([type, value]) => (
                                            <li key={type}><b>{type}</b> {value}</li>
                                        ))
                                    }
                                </ul>
                                :
                                <div className="details-placeholder">
                                    <div/>
                                    <div/>
                                    <div/>
                                </div>
                        }
                        <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)}></Segments>
                        <NumberInput disabled={disabled} min="0" max={currentToken?.balance} value={amount} label={`Available Amount: ${!disabled ? `${currentToken?.balance} ${currentToken?.symbol}` : ''}`} onInput={(value) => setAmount(value)} button="MAX" onButtonClick={setMaxValue}></NumberInput>
                        <Button disabled={disabled} onClick={() => onValidate(segment, token, amount)}>{ segment }</Button>
                    </div>
            }
        </div>
    )
}

export default Card