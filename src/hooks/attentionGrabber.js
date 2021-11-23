import { useEffect } from 'react'
import { useToasts} from './toasts'

let documentTitle = document.title
let flashingTitleInterval = null
let stickyId = null

const useAttentionGrabber = ({ eligibleRequests, isSendTxnShowing, onSitckyClick }) => {
    const { addToast, removeToast } = useToasts()
    
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

            let count = 0
            clearInterval(flashingTitleInterval)
            flashingTitleInterval = setInterval(() => {
                document.title = (count % 2 === 0 ? '⚠️' : '🔥') + ' PENDING SIGNING REQUEST'
                count++
            }, 500)
        } else {
            removeToast(stickyId)
            clearInterval(flashingTitleInterval)
            document.title = documentTitle
        }

        return () => clearInterval(flashingTitleInterval)
    }, [eligibleRequests, isSendTxnShowing, onSitckyClick, addToast, removeToast])
}

export default useAttentionGrabber

