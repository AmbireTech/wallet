import { useState } from 'react';
import './ToolTip.scss'

const ToolTip = ({ children, label, disabled, className }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0})

    const screenBorder = 300
    const margin = 15
    const onMouseMove = ({ clientY, clientX }) => {
        if (clientX > window.innerWidth - screenBorder) clientX = clientX - screenBorder
        setMousePosition({ x: clientX + margin, y: clientY + margin })
    }

    return (
        <div
            className={`tooltip ${className ? className : ''}`}
            onMouseMove={onMouseMove}
        >
            { children }
            {
                !disabled ? 
                    <div className="tooltip-label" style={{top: mousePosition.y, left: mousePosition.x}}>{ label }</div>
                    :
                    null
            }
        </div>
    )
}

export default ToolTip
