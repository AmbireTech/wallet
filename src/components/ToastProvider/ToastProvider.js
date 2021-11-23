import './ToastProvider.scss';

import React, { createRef, useState, useCallback } from "react";
import { MdOutlineClose } from 'react-icons/md';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const ToastContext = React.createContext(null);

let id = 0

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback(id => {
        setToasts(toasts => toasts.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((content, options) => {
        const defaultOptions = {
            timeout: 8000,
            error: false,
            position: 'center',
            sticky: false,
            badge: null,
            onClick: null,
            url: null,
        }

        const toast = {
            id: id++,
            content,
            ref: createRef(),
            ...defaultOptions,
            ...options
        }
        
        setToasts(toasts => [
            ...toasts,
            toast
        ]);

        !toast.sticky && setTimeout(() => removeToast(toast.id), toast.timeout)

        return toast.id;
    }, [setToasts, removeToast]);
    
    return (
        <ToastContext.Provider
            value={{
                addToast,
                removeToast
            }}
        >
            <div id="toast-container">
                <TransitionGroup className="transition-group">
                {
                    toasts.map(({ id, ref, url, error, sticky, badge, position, content, onClick }) => (
                        <CSSTransition timeout={200} classNames="slide-fade" key={id} nodeRef={ref}>
                            <a href={url} target="_blank" rel="noreferrer">
                                <div className={`toast ${error ? 'error' : ''} ${sticky ? 'sticky' : ''} ${position ? position : ''}`} ref={ref}>
                                    <div className="inner" onClick={() => onClick ? onClick() : removeToast(id)}>
                                        { badge ? <div className="badge">{ badge }</div> : null }
                                        { content }
                                    </div>
                                    {
                                        sticky ? 
                                            <div className="close" onClick={() => removeToast(id)}>
                                                <MdOutlineClose/>
                                            </div>
                                            :
                                            null
                                    }
                                </div>
                            </a>
                        </CSSTransition>
                    ))
                }
                </TransitionGroup>
            </div>
            { children }
        </ToastContext.Provider>
    );
};

export { ToastContext };
export default ToastProvider;