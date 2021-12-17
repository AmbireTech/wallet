import { useState } from 'react';
import './ToolTip.scss'

const ToolTip = ({ children, label, className }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0})

    const margin = 15
    const onMouseMove = ({ clientY, clientX }) => setMousePosition({ x: clientX + margin, y: clientY + margin })

    return (
        <div className={`tooltip ${className ? className : ''}`} onMouseMove={onMouseMove}>
            { children }
            <label style={{top: mousePosition.y, left: mousePosition.x}}>{ label }</label>
        </div>
    )
}

export default ToolTip