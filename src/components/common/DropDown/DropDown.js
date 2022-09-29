import styles from './DropDown.module.scss'

import { useEffect, useRef, useState } from 'react';
import { Borders as LoadingBorders } from 'components/common'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/onClickOutside';

export default function DropDown({ children, id, icon, className, menuClassName, title, badge, open, closeOnClick, onChange, onOpen, onClose, style, isLoading, handleClassName }) {
    const ref = useRef();
    const transitionRef = useRef();
    const [isMenuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(open), [open]);
    useEffect(() => onChange && onChange(isMenuOpen), [onChange, isMenuOpen]);
    useEffect(() => !isMenuOpen && onClose && onClose(), [isMenuOpen, onClose]);
    useEffect(() => isMenuOpen && onOpen && onOpen(), [isMenuOpen, onOpen])
    useOnClickOutside(ref, () => setMenuOpen(false));

    return (
        <div id={id} style={style} className={`${styles.dropdown} ${className}`} ref={ref}>
            <div className={styles.content} onClick={() => setMenuOpen(prev => !prev)}>
                {
                    icon ?
                        <div className={styles.icon} style={{backgroundImage: `url(${icon})`}} />
                        :
                        null
                }
                <div className={styles.title}>{ title }</div>
                {
                    badge ?
                        <div className={styles.badge}>
                            { badge > 9 ? '9+' : badge }
                        </div>
                        :
                        null
                }
                {/* <div className={styles.separator}></div> */}
                <div className={`${styles.handle} ${isMenuOpen ? styles.open : ''} ${handleClassName || ''}`}>
                    <img src='resources/icons/arrow-down.svg' alt='arrow-down' />
                </div>

                { isLoading && <LoadingBorders /> }
            </div>
            <CSSTransition unmountOnExit in={isMenuOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                <div className={`${styles.menu} ${menuClassName || ''}`} ref={transitionRef} onClick={closeOnClick ? () => setMenuOpen(false) : null}>
                    { children }
                </div>
            </CSSTransition>
        </div>
    )
}
