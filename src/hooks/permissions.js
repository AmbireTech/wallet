import { useEffect, useState } from "react";

const onPermissionChange = async (name, listener) => {
    try {
        const status = await navigator.permissions.query({ name })
        status.onchange = () => listener(status.state === 'granted')
        return status.state === 'granted'
    } catch(e) {
        console.error(e);
        return false
    }
}

const usePermissions = () => {
    const [arePermissionsLoaded, setPermissionsLoaded] = useState(false)
    const [isClipboardGranted, setClipboardGranted] = useState(false)
    const [isNoticationsGranted, setNotificationsGranted] = useState(false)

    const checkForPermissions = async () => {
        const clipboardState = await onPermissionChange('clipboard-read', state => setClipboardGranted(state))
        setClipboardGranted(clipboardState);

        const notificationsState = await onPermissionChange('notifications', state => setNotificationsGranted(state))
        setNotificationsGranted(notificationsState)

        setPermissionsLoaded(true)
    }

    useEffect(() => checkForPermissions(), [])

    return {
        isClipboardGranted,
        isNoticationsGranted,
        arePermissionsLoaded
    }
}

export default usePermissions