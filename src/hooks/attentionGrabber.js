import { useEffect, useCallback } from 'react'
import { useToasts} from './toasts'
import { usePermissions } from './'

let documentTitle = document.title
let flashingTitleInterval = null
let stickyIds = []

const showFlashingTitle = () => {
    let count = 0
    clearInterval(flashingTitleInterval)
    flashingTitleInterval = setInterval(() => {
        document.title = (count % 2 === 0 ? '⚠️' : '🔥') + ' PENDING SIGNING REQUEST'
        count++
    }, 500)
}

const removeFlashingTitle = () => {
    clearInterval(flashingTitleInterval)
    document.title = documentTitle
}

const useAttentionGrabber = ({ eligibleRequests, isSendTxnShowing, onSitckyClick }) => {
    const { addToast, removeToast } = useToasts()
    const { isNoticationsGranted } = usePermissions()

    const removeStickyToasts = useCallback(() => stickyIds.forEach(id => removeToast(id)), [removeToast])
    
    useEffect(() => {
        if (eligibleRequests.length) {
            if (isSendTxnShowing) removeStickyToasts()
            else {
                stickyIds.push(addToast('Transactions waiting to be signed', {
                    position: 'right',
                    sticky: true,
                    badge: eligibleRequests.length,
                    onClick: () => onSitckyClick()
                }))
            }

            !isNoticationsGranted ? showFlashingTitle() : removeFlashingTitle()
        } else {
            removeStickyToasts()
            removeFlashingTitle()
        }

        return () => clearInterval(flashingTitleInterval)
    }, [isNoticationsGranted, eligibleRequests, isSendTxnShowing, onSitckyClick, addToast, removeToast])
}

export default useAttentionGrabber

