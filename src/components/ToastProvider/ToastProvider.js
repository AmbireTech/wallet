import './ToastProvider.scss';

import React, { createRef, useState } from "react";
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { useCallback } from 'react';

const ToastContext = React.createContext(null);

let id = 0

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((content, options) => {
        const { timeout, error, url } = {
            timeout: 8000,
            error: false,
            url: null,
            ...options
        }

        const toast = {
            id: id++,
            content,
            error,
            url,
            ref: createRef()
        }
        
        setToasts(toasts => [
            ...toasts,
            toast
        ]);
        setTimeout(() => removeToast(toast.id), timeout);
    }, [setToasts]);

    const removeToast = id => {
        setToasts(toasts => toasts.filter(t => t.id !== id));
    };
    
    return (
        <ToastContext.Provider
            value={{
                addToast,
                removeToast
            }}
        >
            
                <div id="toast-container">
                    <TransitionGroup>
                    {
                        toasts.map(toast => (
                            <CSSTransition timeout={200} classNames="slide-fade" key={toast.id} nodeRef={toast.ref}>
                                <a href={toast.url} target="_blank" rel="noreferrer">
                                    <div className={`toast ${toast.error ? 'error' : ''}`} ref={toast.ref} onClick={() => removeToast(toast.id)}>
                                        { toast.content }
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