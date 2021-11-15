import './NumberInput.scss'

const NumberInput = ({ min, max, label, value, button, onButtonClick, onInput }) => {
    return (
        <div className="number-input">
            {
                label ?
                    <label>{ label }</label>
                    :
                    null
            }
            <div className="input">
                <input type="number" value={value} min={min} max={max} onInput={({ target }) => onInput(target.value)}/>
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