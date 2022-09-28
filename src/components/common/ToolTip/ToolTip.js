import { useState } from 'react';
import styles from './ToolTip.module.scss'

const ToolTip = ({ children, label, htmlContent, disabled, className }) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0})

    const screenBorder = 300
    const margin = 15
    const onMouseMove = ({ clientY, clientX }) => {
        if (clientX > window.innerWidth - screenBorder) clientX = clientX - screenBorder
        setMousePosition({ x: clientX + margin, y: clientY + margin })
    }

    const newLineText = text => {
        return text.split('\n').map((str, key) => <div key={key}>{str}</div>)
    }

    return (
        <div
            className={`${styles.tooltip} ${className || ''}`}
            onMouseMove={onMouseMove}
        >
            { children }
            {
                !disabled ?
                    <div className={styles.tooltipLabel} style={{top: mousePosition.y, left: mousePosition.x}}>{ htmlContent || newLineText(label) }</div>
                    :
                    null
            }
        </div>
    )
}

export default ToolTip
