const checkPermissions = async (name, onPrompt) => {
    let status = false;
    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    if (isFirefox) return

    try {
        const { state } = await navigator.permissions.query({
            name,
            allowWithoutGesture: false,
        })
        if (state === 'granted') return true
        if (state === 'prompt') {
            if (onPrompt) {
                await onPrompt
                return checkPermissions(name)
            } else return false
        }
    } catch (e) {
        console.log('non-fatal clipboard error', e)
    }

    return status;
}

const checkClipboardPermission = (prompt = false) => prompt ? checkPermissions('clipboard-read', navigator.clipboard.readText()) : checkPermissions('clipboard-read')
const checkNotificationPermission = (prompt = false) => prompt ? checkPermissions('notifications', Notification.requestPermission()) : checkPermissions('notifications')

export {
    checkClipboardPermission,
    checkNotificationPermission
}