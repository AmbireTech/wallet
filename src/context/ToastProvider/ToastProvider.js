import './ToastProvider.scss'

import React, { createRef, useState, useCallback, useEffect } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { useHistory } from 'react-router-dom'
import { useOfflineStatus } from 'context/OfflineContext/OfflineContext'

const ToastContext = React.createContext(null)
const ERROR_MSG_LIMIT_COUNT = 3
const MSG_CONTENT_LIMIT_SYMBOLS = 400

let id = 0

const ToastProvider = ({ children }) => {
  const history = useHistory()
  const isOffline = useOfflineStatus()
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((toasts) => toasts.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (content, options) => {
      if (content.length > MSG_CONTENT_LIMIT_SYMBOLS) {
        content = `${content.substring(0, MSG_CONTENT_LIMIT_SYMBOLS)}...`
      }
      const defaultOptions = {
        timeout: 8000,
        error: false,
        position: 'center',
        sticky: false,
        badge: null,
        onClick: null,
        url: null,
        route: null
      }

      const toast = {
        id: id++,
        content,
        ref: createRef(),
        ...defaultOptions,
        ...options
      }

      setToasts((toasts) => [...toasts, toast])

      !toast.sticky && setTimeout(() => removeToast(toast.id), toast.timeout)

      return toast.id
    },
    [setToasts, removeToast]
  )

  const updateToastsPositions = useCallback(() => {
    toasts
      .filter(({ sticky }) => !sticky)
      .forEach(({ id, ref }) => {
        const toastElement = ref.current
        if (!toastElement) return

        const bottomToasts = []
        for (let i = id; i <= toasts[toasts.length - 1].id; i++) {
          const element = toasts.filter(({ sticky }) => !sticky).find(({ id }) => id === i)
          if (element) bottomToasts.push(element)
        }

        const style = getComputedStyle(toastElement)
        const marginBottom = parseInt(style.marginBottom)

        const x = document.body.clientWidth / 2 - toastElement.clientWidth / 2
        const y = bottomToasts
          .map(({ ref }) => ref.current && ref.current.offsetHeight)
          .reduce((acc, curr) => acc + curr + marginBottom, 0)
        toastElement.style.transform = `translate(${x}px, -${y}px)`
      })
  }, [toasts])

  const LimitsErrorMsgs = useCallback(() => {
    let errToastsCount = 0
    toasts.forEach((t) => t.error && errToastsCount++)

    if (toasts.length > ERROR_MSG_LIMIT_COUNT && errToastsCount > ERROR_MSG_LIMIT_COUNT) {
      setToasts((prevToasts) =>
        prevToasts.slice(prevToasts.length - ERROR_MSG_LIMIT_COUNT, prevToasts.length)
      )
    }
  }, [toasts])

  useEffect(() => updateToastsPositions(), [toasts, updateToastsPositions])
  useEffect(() => {
    const onResize = () => updateToastsPositions()
    window.addEventListener('resize', onResize, false)
    return () => window.removeEventListener('resize', onResize, false)
  }, [updateToastsPositions])
  useEffect(() => LimitsErrorMsgs(), [LimitsErrorMsgs])

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
          {!isOffline
            ? toasts.map(
                ({ id, ref, url, route, error, sticky, badge, position, content, onClick }) => (
                  <CSSTransition timeout={200} classNames="slide-fade" key={id} nodeRef={ref}>
                    <div
                      className={`toast ${error ? 'error' : ''} ${sticky ? 'sticky' : ''} ${
                        position || ''
                      }`}
                      ref={ref}
                    >
                      <div className="inner" onClick={() => onToastClick(id, onClick, url, route)}>
                        {badge ? <div className="badge">{badge}</div> : null}
                        {content}
                      </div>
                      {sticky ? (
                        <div className="close" onClick={() => removeToast(id)}>
                          <MdOutlineClose />
                        </div>
                      ) : null}
                    </div>
                  </CSSTransition>
                )
              )
            : null}
        </TransitionGroup>
      </div>
      {children}
    </ToastContext.Provider>
  )
}

export { ToastContext }
export default ToastProvider
