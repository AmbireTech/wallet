import './NumberInput.scss'

const NumberInput = ({ min, max, value, button, onButtonClick, onInput }) => {
    return (
        <div className="number-input">
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
    )
}

export default NumberInput