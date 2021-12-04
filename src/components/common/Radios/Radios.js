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
                radios.map(({label, value }, i) => (
                    <div className={`radio-container ${value === currentValue ? 'active' : ''}`} key={`radio-${i}`} onClick={() => onSelect(value)}>
                        <div className="radio"></div>
                        <label>{ label }</label>
                    </div>
                ))
            }
        </div>
    )
}

export default Radios