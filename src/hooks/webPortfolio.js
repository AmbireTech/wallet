import { useEffect, useState, useCallback } from "react"
import { usePortfolio } from '.'
import { getDocVisibilityProps } from "lib/documentVisibility"
import { fetchGet } from "lib/fetch";
import { useToasts } from "./toasts"
import { ZAPPER_API_KEY, ZAPPER_API_ENDPOINT, VELCRO_API_ENDPOINT } from 'config';

const getBalances = (network, protocol, address, provider) => {
    const providerApi = provider === 'velcro' ? VELCRO_API_ENDPOINT : ZAPPER_API_ENDPOINT
    const url = `${providerApi}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${ZAPPER_API_KEY}&newBalances=true`

    return fetchGet(url)
}

export default function useWebPortfolio(props) {
    const [isVisible, setIsVisible] = useState(false)
    const { addToast } = useToasts()
    const { hidden, visibilityChange } = getDocVisibilityProps()

    const handleVisibilityChange = useCallback(() => {
        const isDocVisible = !document[hidden]
        setIsVisible(isDocVisible)
    }, [hidden, setIsVisible])

    useEffect(() => {
        document.addEventListener(visibilityChange, handleVisibilityChange, false)
        return () => document.removeEventListener(visibilityChange, handleVisibilityChange, false)
    }, [handleVisibilityChange, visibilityChange])

    return usePortfolio({ ...props, isVisible, onMessage: addToast, getBalances })
}
