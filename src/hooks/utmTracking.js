import { useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export default function useUtmTracking ({ useStorage }) {
    const { search } = useLocation()
    
    const currentUtm = useMemo(() => {
        const searchParams = new URLSearchParams(search)
        const current = {}        
        for (const p of searchParams) {
            if (p && p[0].startsWith('utm_')) {
                const key = p[0].substring(p[0].indexOf('utm_')+4)            
                current[key] = p[1];
            }
        }
        return current
    }, [search])
    
    const [utm, _setUtm] = useStorage({
        key: 'utm',
        defaultValue: []
    })
    
    const setUtm = useCallback(_utm => {
        _setUtm((prev) => [
            ...prev,
            {
                ..._utm,
                identityCompleted: false,
                date: new Date().valueOf()
            }
        ])
    }, [_setUtm])

    const resetUtm = () => {
        _setUtm([])
    }

    const getLatestUtmData = useCallback(() => utm.length && utm.map((el, i) => i === utm.length-1 ? { ...el, identityCompleted: true } : el), [utm])
    
    useEffect(() => {
        if (Object.keys(currentUtm).length) {
            setUtm(currentUtm)
        }
    }, [currentUtm, search, setUtm])

    return { utm, resetUtm, getLatestUtmData }
}
