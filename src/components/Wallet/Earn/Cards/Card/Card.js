import './Card.scss'

import { Select, Segments, NumberInput, Button } from '../../../../common'
import { useEffect, useState } from 'react'

const Card = ({ tokens, icon, details, onTokenSelect, onValidate }) => {
    const segments = [{ value: 'Deposit' }, { value: 'Withdraw' }]
    const [segment, setSegment] = useState(segments[0].value)
    const [token, setToken] = useState()
    const [amount, setAmount] = useState(0)
    const [disabled, setDisabled] = useState(true)

    const currentToken = tokens.find(({ value }) => value === token)

    const setMaxValue = () => {
        setAmount(currentToken?.balance)
    }

    useEffect(() => {
        onTokenSelect(token)
        setDisabled(!token || amount <= 0 || !tokens.length)
    }, [token, onTokenSelect, amount, tokens.length])

    return (
        <div className="card">
            <div className="title">
                <img src={icon} alt="Icon" />
            </div>
            <div className="content">
                <Select searchable disabled={disabled} label="Choose Token" defaultValue={token} items={tokens} onChange={(value) => setToken(value)}/>
                <ul className="details">
                    {
                        details.map(([type, value]) => (
                            <li key={type}><b>{type}</b> {value}</li>
                        ))
                    }
                </ul>
                <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)}></Segments>
                <NumberInput disabled={disabled} min="0" max={currentToken?.balance} value={amount} label={`Available Amount: ${!disabled ? `${currentToken?.balance} ${currentToken?.symbol}` : ''}`} onInput={(value) => setAmount(value)} button="MAX" onButtonClick={setMaxValue}></NumberInput>
                <Button disabled={disabled} onClick={() => onValidate(segment, token, amount)}>{ segment }</Button>
            </div>
        </div>
    )
}

export default Card