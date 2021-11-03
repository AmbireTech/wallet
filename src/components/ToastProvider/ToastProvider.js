import './ToastProvider.scss';

import React, { createRef, useState } from "react";
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [count, setCount] = useState(0);

    const addToast = (content, timeout = 3000) => {
        setToasts(toasts => [
            ...toasts,
            {
                id: count,
                content,
                ref: createRef()
            }
        ]);
        setTimeout(() => removeToast(count), timeout);
        setCount(count => count + 1);
    };

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
                                <div className="toast" ref={toast.ref}>
                                    { toast.content }
                                </div>
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