import './NumberInput.scss'

const NumberInput = ({ disabled, min, max, label, value, button, onButtonClick, onInput }) => {
    return (
        <div className={`number-input ${disabled ? 'disabled' : ''}`}>
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="input">
                <input type="number" disabled={disabled} value={value} min={min} max={max} onInput={({ target }) => onInput(target.value)}/>
                {
                    button ?
                        <div className="button" onClick={onButtonClick}>
                            { button }
                        </div>
                        :
                        null
                }
            </div>
        </div>
    )
}

export default NumberInput