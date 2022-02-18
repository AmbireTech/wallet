import { useEffect, useState, useCallback } from "react"
import { usePortfolio } from '.'
import { getDocVisibilityProps } from "lib/documentVisibility"
import { useToasts } from "./toasts"

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

    return usePortfolio({ ...props, isVisible, onMessage: addToast })
}
