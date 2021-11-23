import { useEffect } from 'react'
import { useToasts} from './toasts'
import { usePermissions } from './'

let documentTitle = document.title
let flashingTitleInterval = null
let stickyId = null

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
    
    useEffect(() => {
        if (eligibleRequests.length) {
            if (isSendTxnShowing) removeToast(stickyId)
            else {
                stickyId = addToast('Transactions waiting to be signed', {
                    position: 'right',
                    sticky: true,
                    badge: eligibleRequests.length,
                    onClick: () => onSitckyClick()
                })
            }

            !isNoticationsGranted ? showFlashingTitle() : removeFlashingTitle()
        } else {
            removeToast(stickyId)
            removeFlashingTitle()
        }

        return () => clearInterval(flashingTitleInterval)
    }, [isNoticationsGranted, eligibleRequests, isSendTxnShowing, onSitckyClick, addToast, removeToast])
}

export default useAttentionGrabber

