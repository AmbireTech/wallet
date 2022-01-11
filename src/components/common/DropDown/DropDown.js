import './DropDown.scss'

import { useEffect, useRef, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from 'hooks/onClickOutside';

export default function DropDown({ children, id, icon, className, title, badge, open, closeOnClick, onChange, onOpen, onClose, style }) {
    const ref = useRef();
    const transitionRef = useRef();
    const [isMenuOpen, setMenuOpen] = useState(false);

    useEffect(() => setMenuOpen(open), [open]);
    useEffect(() => onChange && onChange(isMenuOpen), [onChange, isMenuOpen]);
    useEffect(() => !isMenuOpen && onClose && onClose(), [isMenuOpen, onClose]);
    useEffect(() => isMenuOpen && onOpen && onOpen(), [isMenuOpen, onOpen])
    useOnClickOutside(ref, () => setMenuOpen(false));

    return (
        <div id={id} style={style} className={`dropdown ${className}`} ref={ref}>
            <div className="content" onClick={() => setMenuOpen(!isMenuOpen)}>
                {
                    icon ?
                        <div className="icon" style={{backgroundImage: `url(${icon})`}} />
                        :
                        null
                }
                <div className="title">{ title }</div>
                {
                    badge ? 
                        <div className="badge">
                            { badge > 9 ? '9+' : badge }
                        </div>
                        :
                        null
                }
                <div className="separator"></div>
                <div className={`handle ${isMenuOpen ? 'open' : ''}`}>
                    <BsChevronDown size={20}></BsChevronDown>
                </div>
            </div>
            <CSSTransition unmountOnExit in={isMenuOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                <div className="menu" ref={transitionRef} onClick={closeOnClick ? () => setMenuOpen(false) : null}>
                    { children }
                </div>
            </CSSTransition>
        </div>
    )
}