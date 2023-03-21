import './ToastProvider.scss';

import React, { createRef, useState, useCallback, useEffect } from "react";
import { MdOutlineClose } from 'react-icons/md';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import { useHistory } from 'react-router-dom'

const ToastContext = React.createContext(null);

let id = 0

const ToastProvider = ({ children }) => {
    const history = useHistory()
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
            route: null,
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

    const updateToastsPositions = useCallback(() => {
        toasts
            .filter(({ sticky }) => !sticky)
            .forEach(({ id, ref }) => {
                const toastElement = ref.current
                if (!toastElement) return

                let bottomToasts = []
                for (let i = id; i <= toasts[toasts.length - 1].id; i++) {
                    const element = toasts.filter(({ sticky }) => !sticky).find(({ id }) => id === i)
                    if (element) bottomToasts.push(element)
                }

                const style = getComputedStyle(toastElement)
                const marginBottom = parseInt(style.marginBottom)

                const x = (document.body.clientWidth / 2) - (toastElement.clientWidth / 2)
                const y = bottomToasts.map(({ ref }) => ref.current && ref.current.offsetHeight).reduce((acc, curr) => acc + curr + marginBottom, 0)
                toastElement.style.transform = `translate(${x}px, -${y}px)`
            })
    }, [toasts])

    useEffect(() => updateToastsPositions(), [toasts, updateToastsPositions])
    useEffect(() => {
        const onResize = () => updateToastsPositions()
        window.addEventListener('resize', onResize, false);
        return () => window.removeEventListener('resize', onResize, false);
    }, [updateToastsPositions])

    const onToastClick = (id, onClick, url, route) => {
        if (url) window.open(url, '_blank')
        else if (route) history.push(route)
        onClick ? onClick() : removeToast(id)
    }
    
    return (
        <ToastContext.Provider
            value={{
                addToast,
                removeToast
            }}
        >
            <div id="toast-container" className={!toasts.length ? 'hide' : ''}>
                <TransitionGroup className="transition-group">
                {
                    toasts.map(({ id, ref, url, route, error, sticky, badge, position, content, onClick }) => (
                        <CSSTransition timeout={200} classNames="slide-fade" key={id} nodeRef={ref}>
                            <div className={`toast ${error ? 'error' : ''} ${sticky ? 'sticky' : ''} ${position ? position : ''}`} ref={ref}>
                                <div className="inner" onClick={() => onToastClick(id, onClick, url, route)}>
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