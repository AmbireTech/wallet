import { isFirefox } from 'lib/isFirefox'

const checkPermissions = async (name, onPrompt) => {
    let status = false;

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
        console.error('Error while trying to query permissions', e)
    }

    return status;
}

const checkClipboardPermission = (prompt = false) => isFirefox() ? false : prompt ? checkPermissions('clipboard-read', navigator.clipboard.readText()) : checkPermissions('clipboard-read')
const checkNotificationPermission = (prompt = false) => prompt ? checkPermissions('notifications', Notification.requestPermission()) : checkPermissions('notifications')

const askForPermission = async name => {
    try {
        if (name === 'clipboard-read') {
            await navigator.clipboard.readText()
            return true
        }

        if (name === 'notifications') {
            const status = await Notification.requestPermission()
            return status === 'granted' || status === 'default'
        }

        return false
    } catch(e) {
        console.error(`Permission ${name} blocked`);
        return false
    }
}

export {
    askForPermission,
    checkClipboardPermission,
    checkNotificationPermission
}
