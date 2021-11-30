import { useState } from 'react';
import './ToolTip.scss'

const ToolTip = ({ children, label, className }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0})

    const onMouseMove = ({ clientY, clientX }) => setMousePosition({ x: clientX + 15, y: clientY + 15 })

    return (
        <div className={`tooltip ${className}`} onMouseMove={onMouseMove}>
            { children }
            <label style={{top: mousePosition.y, left: mousePosition.x}}>{ label }</label>
        </div>
    )
}

export default ToolTip