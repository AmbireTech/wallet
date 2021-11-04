import React from 'react';
import './Checkbox.css'

function Checkbox(props) {
    const inputElem =  (
        <input type="checkbox" checked={props.checked} required={props.required} onChange={props.onChange}/>
    )

    return props.label ? (<label className="checkbox-container">
        {inputElem}
        <div className="checkbox-mark"></div>
        <div className="checkbox-label">{props.label}</div>
    </label>) : (<>
        {inputElem}
        <div className="checkbox-mark"></div>
    </>)
}

export { Checkbox as default }