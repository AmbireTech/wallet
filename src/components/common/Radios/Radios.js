import './Radios.scss'

import { useState } from 'react'

const Radios = ({ radios, defaultValue, onChange }) => {
    const [currentValue, setCurrentValue] = useState(defaultValue || null)

    const onSelect = value => {
        setCurrentValue(value)
        onChange && onChange(value)
    }

    return (
        <div className="radios-container">
            {
                radios.map(({label, value, disabled }, i) => (
                    <div className={`radio-container ${value === currentValue ? 'active' : ''} ${disabled ? 'disabled' : ''}`} key={`radio-${i}`} onClick={() => !disabled && onSelect(value)}>
                        <div className="radio"></div>
                        <label>{ label }</label>
                    </div>
                ))
            }
        </div>
    )
}

export default Radios