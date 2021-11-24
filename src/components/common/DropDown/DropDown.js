import './DropDown.scss'

import { useEffect, useRef, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs'
import { CSSTransition } from 'react-transition-group';
import useOnClickOutside from '../../../helpers/onClickOutside';

export default function DropDown({ children, id, icon, title, badge, closed, onOpen, closeOnClick, style }) {
    const ref = useRef();
    const transitionRef = useRef();
    const [isDropDownOpen, setDropDownOpen] = useState(false);

    useEffect(() => closed ? setDropDownOpen(false) : null, [closed])
    useEffect(() => onOpen && isDropDownOpen ? onOpen(true) : null, [isDropDownOpen, onOpen])
    useOnClickOutside(ref, () => setDropDownOpen(false));

    return (
        <div id={id} style={style} className="dropdown" ref={ref}>
            <div className="content" onClick={() => setDropDownOpen(!isDropDownOpen)}>
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
                <div className={`handle ${isDropDownOpen ? 'open' : ''}`}>
                    <BsChevronDown size={20}></BsChevronDown>
                </div>
            </div>
            <CSSTransition unmountOnExit in={isDropDownOpen} timeout={200} classNames="fade" nodeRef={transitionRef}>
                <div className="menu" ref={transitionRef} onClick={closeOnClick ? () => setDropDownOpen(false) : null}>
                    { children }
                </div>
            </CSSTransition>
        </div>
    )
}