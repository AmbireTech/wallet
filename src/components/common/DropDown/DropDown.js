import styles from './DropDown.module.scss'
import cn from 'classnames'
import { useEffect, useRef, useState } from 'react';
import { Borders as LoadingBorders } from 'components/common'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/onClickOutside';
import { ReactComponent as ChevronDownIcon } from 'resources/icons/chevron-down.svg'

export default function DropDown({ children, id, icon, className, menuClassName, handleClassName, titleClassName, title, badge, open, closeOnClick, onChange, onOpen, onClose, style, isLoading, testId }) {
    const ref = useRef();
    const transitionRef = useRef();
    const [isMenuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(open), [open]);
    useEffect(() => onChange && onChange(isMenuOpen), [onChange, isMenuOpen]);
    useEffect(() => !isMenuOpen && onClose && onClose(), [isMenuOpen, onClose]);
    useEffect(() => isMenuOpen && onOpen && onOpen(), [isMenuOpen, onOpen])
    useOnClickOutside(ref, () => setMenuOpen(false));

    return (
        <div id={id} style={style} className={cn(styles.dropdown, className)} ref={ref} data-testid={testId}>
            <div className={styles.content} onClick={() => setMenuOpen(prev => !prev)}>
                {
                    icon ?
                        <div className={styles.icon} style={{backgroundImage: `url(${icon})`}} />
                        :
                        null
                }
                <div className={cn(styles.title, titleClassName)}>{ title }</div>
                {
                    badge ?
                        <div className={styles.badge}>
                            { badge > 9 ? '9+' : badge }
                        </div>
                        :
                        null
                }
                {/* <div className={styles.separator}></div> */}
                <div className={cn(styles.handle, handleClassName, {[styles.open]: isMenuOpen})}>
                    <ChevronDownIcon />
                </div>

                { isLoading && <LoadingBorders /> }
            </div>
            <CSSTransition unmountOnExit in={isMenuOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                <div className={cn(styles.menu, menuClassName)} ref={transitionRef} onClick={closeOnClick ? () => setMenuOpen(false) : null}>
                    { children }
                </div>
            </CSSTransition>
        </div>
    )
}
