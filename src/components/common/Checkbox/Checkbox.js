import React, { forwardRef } from 'react';
import './Checkbox.scss'

const Checkbox = forwardRef((props, ref) => {
    const inputElem =  (
        <input type="checkbox" checked={props.checked} required={props.required} onChange={props.onChange} ref={ref} data-testid={props.testId}/>
    )

    return props.label ? (<label className={`checkbox-container ${props.disabled ? 'disabled': ''}`}>
        {inputElem}
        <div className="checkbox-mark"></div>
        <div className="checkbox-label">{props.label}</div>
    </label>) : (<>
        {inputElem}
        <div className="checkbox-mark"></div>
    </>)
})

export { Checkbox as default }