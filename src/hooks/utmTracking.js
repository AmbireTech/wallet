import { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export default function useUtmTracking ({ useStorage, accounts }) {
    const { search } = useLocation()
    const searchParams = new URLSearchParams(search)
    const isLoggedIn = useMemo(() => accounts.length > 0, [accounts])

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const current = {}
    for (const p of searchParams) {
        if (p && p[0].includes('utm')) {
            const key = p[0].substring(p[0].indexOf('utm_')+4)            
            current[key] = p[1];
        }
    }
    
    const [utm, setUtm] = useStorage({
        key: 'utm',
        defaultValue: []
    })

    const setNewCampaign = useCallback((campaign) => {
        setUtm((prev) => [
            ...prev,
            campaign
        ])
    }, [setUtm])
    
    useEffect(() => {
        if (!isLoggedIn && Object.keys(current).length) {
            setNewCampaign({...current, identityCompleted: isLoggedIn, date: new Date().valueOf() })
        } 
    }, [current, utm.length, setNewCampaign, isLoggedIn])

    return { utm }
}
