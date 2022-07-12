import { useState, useCallback, useMemo } from 'react'
import { UseDappModeProps, UseDappModeReturnType, DappManifestData } from './types'
import { DEFAULT_CATALOG } from './catalogs'

export default function useDappMode({ useStorage }: UseDappModeProps): UseDappModeReturnType {

    const [isDappMode, setIsDappMode] = useStorage<boolean>({ key: 'isDappMode' })
    const [sideBarOpen, setSideBarOpen] = useState(false)
    const [currentDappData, setCurrentDappData] = useStorage<DappManifestData>({ key: 'currentDappData' })
    const [customDapps, updateCustomDapps] = useStorage<Array<DappManifestData>>({ key: 'customDapps' })

    const catalog = useMemo(() =>
        [...DEFAULT_CATALOG, ...customDapps]
        , [customDapps])

    const toggleDappMode = useCallback(() => {
        setIsDappMode(!isDappMode)
    }, [isDappMode, setIsDappMode])

    const toggleSideBarOpen = useCallback(() => {
        setSideBarOpen(!sideBarOpen)
    }, [sideBarOpen])

    const loadCurrentDappData = useCallback((data: DappManifestData) => {
        setCurrentDappData(data)
    }, [setCurrentDappData])

    const addCustomDapp = useCallback((dapp: DappManifestData) => {
        const exists = customDapps.find(x => x.url === dapp.url)
        if (!exists) {
            updateCustomDapps([...customDapps, dapp])
        }
    }, [customDapps, updateCustomDapps])


    const removeCustomDapp = useCallback((dapp: DappManifestData) => {
        const index = customDapps.findIndex(x => x.url === dapp.url)
        if (index >= 0) {
            updateCustomDapps([...customDapps].splice(index, 1))
        }
    }, [customDapps, updateCustomDapps])

    return {
        isDappMode,
        sideBarOpen,
        currentDappData,
        toggleDappMode,
        toggleSideBarOpen,
        loadCurrentDappData,
        addCustomDapp,
        removeCustomDapp,
        catalog
    }
}