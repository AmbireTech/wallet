import './ToastProvider.css';

import React, { useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from 'react-transition-group';

const ToastContext = React.createContext(null);

const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const [count, setCount] = useState(0);
    const transitionRef = useRef();

    const addToast = (content, timeout = 3000) => {
        setToasts(toasts => [
            ...toasts,
            {
                id: count,
                content
            }
        ]);
        setCount(count => count + 1);
        setTimeout(() => removeToast(count), timeout);
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
                            <CSSTransition timeout={200} classNames="slide-fade" key={toast.id} nodeRef={transitionRef}>
                                <div className="toast" ref={transitionRef}>
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