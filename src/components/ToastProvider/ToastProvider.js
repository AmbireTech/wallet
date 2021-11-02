import './ToastProvider.css';

import React, { useState } from "react";

const ToastContext = React.createContext(null);

const ToastProvider = (props) => {
    const [toasts, setToasts] = useState([]);
    const [count, setCounter] = useState(0);

    const addToast = content => {
        setToasts(toasts => [
            ...toasts,
            {
                id: count,
                content
            }
        ]);
        setCounter(count + 1);
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
                {
                    toasts.map(toast => (
                        <div className="toast" key={toast.id}>
                            { toast.content }
                        </div>
                    ))
                }
            </div>
            { props.children }
        </ToastContext.Provider>
    );
};

export { ToastContext };
export default ToastProvider;