import React from 'react';
import './Checkbox.css'

function Checkbox(props) {
    return props.label ? (<label className="checkbox-container">
        <input type="checkbox" checked={props.checked} required={props.required} onChange={props.onChange}/>
        <div className="checkbox-mark"></div>
        <div className="checkbox-label">{props.label}</div>
    </label>) : (<>
        <input type="checkbox" required={props.required}/>
        <div className="checkbox-mark"></div>
    </>)
}

export { Checkbox as default }