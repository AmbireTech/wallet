import { useCallback } from "react"

export default function useGasTank ({ selectedAcc, useStorage } = {}) {
    const defaultGasTankState = [{ account: selectedAcc, isEnabled: false }]
    const [state, setState] = useStorage({
        key: 'gasTankState', 
        defaultValue: defaultGasTankState,
    })

    const setGasTankState = useCallback(newState => {
        setState(newState)
    }, [setState])
    
    return {
        gasTankState: state,
        setGasTankState
    }
}
