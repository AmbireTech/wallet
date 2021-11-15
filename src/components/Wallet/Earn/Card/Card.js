import './Card.scss'

import { Select, Segments, NumberInput, Button } from '../../../common'
import { useState } from 'react'

const Card = ({ tokens, icon, details, onTokenSelect }) => {
    const segments = [{ value: 'Deposit' }, { value: 'Widthdraw' }]
    const [segment, setSegment] = useState(segments[0].value)
    const [token, setToken] = useState()
    const [amount, setAmount] = useState(0)

    const currentToken = tokens.find(({ value }) => value === token)

    const setMaxValue = () => {
        setAmount(currentToken?.balance)
    }

    const selectToken = value => {
        setToken(value)
        onTokenSelect(value)
    }

    return (
        <div className="card">
            <div className="title">
                <img src={icon} alt="Icon" />
            </div>
            <div className="content">
                <Select searchable label="Choose Token" defaultValue={token} items={tokens} onChange={selectToken}/>
                <ul className="details">
                    {
                        details.map(([type, value]) => (
                            <li key={type}><b>{type}</b> {value}</li>
                        ))
                    }
                </ul>
                <Segments small defaultValue={segment} segments={segments} onChange={(value) => setSegment(value)}></Segments>
                <NumberInput min="0" max={currentToken?.balance} value={amount} label={`Available Amount: ${currentToken?.balance}`} onInput={(value) => setAmount(value)} button="MAX" onButtonClick={setMaxValue}></NumberInput>
                <Button>{ segment }</Button>
            </div>
        </div>
    )
}

export default Card