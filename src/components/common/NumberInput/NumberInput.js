import './NumberInput.scss'

const NumberInput = ({ disabled, min, max, label, value, button, onButtonClick, onInput, onChange }) => {
    const onInputValue = ({ target }) => {
        if (!onInput) return
        if (!target.value.length) return onInput('')
        const isIntOrFloat = /^[0-9]+\.{0,1}[0-9]*$/g.test(target.value)
        isIntOrFloat && onInput(target.value)
    }

    return (
        <div className={`number-input ${disabled ? 'disabled' : ''}`}>
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="input">
                <input
                    type="text"
                    disabled={disabled}
                    value={value}
                    onInput={onInputValue}
                />
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