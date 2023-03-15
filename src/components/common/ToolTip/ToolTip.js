import styles from './ToolTip.module.scss'
import { useState, useRef, useCallback } from 'react'
import cn from 'classnames'

const newLineText = (text = '') => {
    return text.split('\n').map((str, key) => <div key={key}>{str}</div>)
}

const ToolTip = ({ children, label, htmlContent, disabled, className, labelClassName }) => {
    const [labelPosition, setLabelPosition] = useState({ top: 0, left: 0 })
    const [arrowPosition, setArrowPosition] = useState('top left')
    const ref = useRef(null)

    const margin = 15
    const onMouseEnter = useCallback(() => {
        // TODO: See if anyone will have issues when scrolling and hovering simultaneously
        // and then update events
        if (ref?.current?.children?.length < 2) return

        const childBounding = ref.current.children[0].getBoundingClientRect()
        const tooltipBounding = ref.current.children[1].getBoundingClientRect()

        const tooltipPosition = {
            top: childBounding.height + childBounding.top + margin,
            left: childBounding.left,
            bottom: 'auto',
            right: 'auto'
        }

        const position = {
            vertical: 'top',
            horizontal: 'left'
        }

        if (
            window.innerWidth - childBounding.right <= tooltipBounding.width
        ) {
            tooltipPosition.left = 'auto'
            tooltipPosition.right = window.innerWidth - childBounding.right
            position.horizontal = 'right'
        }

        if (
            window.innerHeight - childBounding.bottom - margin <= tooltipBounding.height
        ) {
            tooltipPosition.top = 'auto'
            tooltipPosition.bottom = window.innerHeight - childBounding.bottom + childBounding.height + margin
            position.vertical = 'bottom'
        }

        setLabelPosition(tooltipPosition)
        setArrowPosition(`${position.vertical} ${position.horizontal}`)
    }, [ref])


    return (
        !children ? null :
            <div
                ref={ref}
                className={cn(styles.tooltip, className)}
                onMouseEnter={onMouseEnter}
                onTouchStart={onMouseEnter}
            >
                {children}
                {
                    !disabled && (!!htmlContent || !!label) ?
                        <div className={cn(styles.tooltipLabel, labelClassName)} style={labelPosition}>
                            {htmlContent || newLineText(label)}
                            <div className={cn(styles.arrow, ...(arrowPosition.split(' ').map(position => styles[position])))}></div>
                        </div>
                        :
                        null
                }
            </div>
    )
}

export default ToolTip
