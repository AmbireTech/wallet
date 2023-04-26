import { useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useToasts } from './toasts'

const documentTitle = document.title
let flashingTitleInterval = null
const stickyIds = []

const showFlashingTitle = () => {
  let count = 0
  clearInterval(flashingTitleInterval)
  flashingTitleInterval = setInterval(() => {
    document.title = `${count % 2 === 0 ? '⚠️' : '🔥'} PENDING SIGNING REQUEST`
    count++
  }, 500)
}

const removeFlashingTitle = () => {
  clearInterval(flashingTitleInterval)
  document.title = documentTitle
}

const useAttentionGrabber = ({ eligibleRequests, isSendTxnShowing, onSitckyClick }) => {
  const location = useLocation()
  const { addToast, removeToast } = useToasts()

  const removeStickyToasts = useCallback(
    () => stickyIds.forEach((id) => removeToast(id)),
    [removeToast]
  )
  const isRouteWallet = useMemo(() => location.pathname.startsWith('/wallet'), [location.pathname])

  useEffect(() => {
    if (eligibleRequests.length && isRouteWallet) {
      if (isSendTxnShowing) removeStickyToasts()
      else {
        stickyIds.push(
          addToast('Transactions waiting to be signed', {
            position: 'right',
            sticky: true,
            badge: eligibleRequests.length,
            onClick: () => onSitckyClick()
          })
        )
      }

      !(window.Notification && Notification.permission !== 'denied')
        ? showFlashingTitle()
        : removeFlashingTitle()
    } else {
      removeStickyToasts()
      removeFlashingTitle()
    }

    return () => clearInterval(flashingTitleInterval)
  }, [
    removeStickyToasts,
    eligibleRequests,
    isSendTxnShowing,
    onSitckyClick,
    addToast,
    removeToast,
    isRouteWallet
  ])
}

export default useAttentionGrabber
