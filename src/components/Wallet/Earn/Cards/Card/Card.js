import './Card.scss'

import { Select, Segments, NumberInput, Button } from '../../../../common'
import { useEffect, useState } from 'react'

const Card = ({ tokens, icon, details, onTokenSelect, onValidate }) => {
    const segments = [{ value: 'Deposit' }, { value: 'Withdraw' }]
    const [segment, setSegment] = useState(segments[0].value)
    const [token, setToken] = useState()
    const [amount, setAmount] = useState(0)

    const currentToken = tokens.find(({ value }) => value === token)

    const setMaxValue = () => {
        setAmount(currentToken?.balance)
    }

    useEffect(() => onTokenSelect(token), [token, onTokenSelect])

    return (
        <div className="card">
            <div className="title">
                <img src={icon} alt="Icon" />
            </div>
            <div className="content">
                <Select searchable label="Choose Token" defaultValue={token} items={tokens} onChange={(value) => setToken(value)}/>
                <ul className="details">
                    {
                        details.map(([type, value]) => (
                            <li key={type}><b>{type}</b> {value}</li>
                        ))
                    }
                </ul>
                <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)}></Segments>
                <NumberInput min="0" max={currentToken?.balance} value={amount} label={`Available Amount: ${currentToken?.balance} ${currentToken?.symbol}`} onInput={(value) => setAmount(value)} button="MAX" onButtonClick={setMaxValue}></NumberInput>
                <Button onClick={() => onValidate(segment, token, amount)}>{ segment }</Button>
            </div>
        </div>
    )
}

export default Card