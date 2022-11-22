import './Radios.scss'

import { useState } from 'react'

const Radios = ({ radios, defaultValue, onChange, value, row }) => {
    const [currentValue, setCurrentValue] = useState(defaultValue || null)
    const controlledValue = value || currentValue

    const onSelect = value => {
        setCurrentValue(value)
        onChange && onChange(value)
    }

    return (
        <div className={`radios-container${row ? ' row' : ''}`}>
            {
                radios.map(({label, value, disabled }, i) => (
                    <div className={`radio-container ${value === controlledValue ? 'active' : ''} ${disabled ? 'disabled' : ''}`} key={`radio-${i}`} onClick={() => !disabled && onSelect(value)}>
                        <div className="radio"></div>
                        <label>{ label }</label>
                    </div>
                ))
            }
        </div>
    )
}

export default Radios