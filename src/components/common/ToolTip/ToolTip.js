import { useState } from 'react';
import './ToolTip.scss'

const ToolTip = ({ children, label, disabled, className }) => {
    const [isMouseOver, setIsMouseOver] = useState(false)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0})

    const margin = 15
    const onMouseMove = ({ clientY, clientX }) => setMousePosition({ x: clientX + margin, y: clientY + margin })

    return (
        <div
            className={`tooltip ${className ? className : ''}`}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setIsMouseOver(false)}
            onMouseEnter={() => setIsMouseOver(true)}
        >
            { children }
            {
                isMouseOver && !disabled ? 
                    <label style={{top: mousePosition.y, left: mousePosition.x}}>{ label }</label>
                    :
                    null
            }
        </div>
    )
}

export default ToolTip