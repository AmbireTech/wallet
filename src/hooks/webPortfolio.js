import { useEffect, useState } from "react";
import { usePortfolio } from '.'
import { getDocVisibilityProps } from "lib/documentVisibility";

export default function useWebPortfolio(props) {
    const [isVisible, setIsVisible] = useState(false)
    const { hidden, visibilityChange } = getDocVisibilityProps()

    const handleVisibilityChange = () => {
        const isDocVisible = !document[hidden]
        setIsVisible(isDocVisible)
    }

    useEffect(() => {
        document.addEventListener(visibilityChange, handleVisibilityChange, false);
        return () => document.removeEventListener(visibilityChange, handleVisibilityChange, false);
    }, [])

    return usePortfolio({ ...props, isVisible })
}
