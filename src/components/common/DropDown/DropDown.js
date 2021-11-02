import './DropDown.css'

import { useEffect, useRef, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs'

export default function DropDown(props) {
    const ref = useRef();
    const [isDropDownOpen, setDropDownOpen] = useState(false);

    function useOnClickOutside(ref, handler) {
        useEffect(
            () => {
                const listener = (event) => {
                    if (!ref.current || ref.current.contains(event.target)) {
                        return;
                    }
                    handler(event);
                };
                document.addEventListener("mousedown", listener);
                document.addEventListener("touchstart", listener);
                    return () => {
                        document.removeEventListener("mousedown", listener);
                        document.removeEventListener("touchstart", listener);
                    };
            },
            [ref, handler]
        );
    }

    useOnClickOutside(ref, () => setDropDownOpen(false));

    return (
        <div className="dropdown" ref={ref}>
            <div className="content" onClick={() => setDropDownOpen(!isDropDownOpen)}>
                <div className="title">{props.title}</div>
                {
                    props.badge ? 
                        <div className="badge">
                            { props.badge > 9 ? '9+' : props.badge }
                        </div>
                        :
                        null
                }
                <BsChevronDown size={20}></BsChevronDown>
            </div>
            {
                isDropDownOpen ? 
                    <div className="list">
                        {props.children}
                    </div>
                    :
                    null
            }
        </div>
    )
}