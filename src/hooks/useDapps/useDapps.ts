import { useState, useCallback, useMemo, useEffect } from 'react'
import { UseDappsProps, UseDappsReturnType, DappManifestData, Category } from './types'
import getWalletDappCatalog from 'wallet-dapp-catalog'


const CATEGORIES: Array<Category> = [
    {
        name: 'all',
        filter: (f: any) => f
    },
    {
        name: 'integrated',
        filter: (f: any) => f.connectionType === 'gnosis'
    },
    {
        name: 'walletconnect',
        filter: (f: any) => f.connectionType === 'walletconnect'
    },
    {
        name: 'favorites',
        filter: (f: any, faves: object) => Object.keys(faves).indexOf(f.url) !== -1
    }
]

const withCategory = (dapp: DappManifestData) => ({...dapp, category: dapp.connectionType === 'gnosis' ? 'integrated' : dapp.connectionType}) 

export default function useDapps({ useStorage }: UseDappsProps): UseDappsReturnType {

    const categories = useMemo(() => CATEGORIES, [])
    const defaultCatalog = useMemo(() => getWalletDappCatalog(), [])

    const [isDappMode, setIsDappMode] = useStorage<boolean>({ key: 'isDappMode' })
    const [sideBarOpen, setSideBarOpen] = useState(false)
    const [currentDappData, setCurrentDappData] = useStorage<DappManifestData | null>({ key: 'currentDappData' })
    const [customDapps, updateCustomDapps] = useStorage<Array<DappManifestData>>({ key: 'customDapps', defaultValue: [] })

    const [search, setSearch] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<Category>(categories[0])
    const [favorites, setFavorites] = useStorage<{ [key: string]: boolean }>({
        key: 'dappCatalog-faves',
        defaultValue: {},
    })


    const catalog = useMemo(() =>
        [...defaultCatalog, ...customDapps].map(withCategory)
        , [customDapps, defaultCatalog])

    const [filteredCatalog, setFilteredItems] = useState(catalog)

    const toggleDappMode = useCallback(() => {
        setIsDappMode(!isDappMode)
    }, [isDappMode, setIsDappMode])

    const toggleSideBarOpen = useCallback(() => {
        setSideBarOpen(!sideBarOpen)
    }, [sideBarOpen])

    const loadCurrentDappData = useCallback((data: DappManifestData | null) => {
        setCurrentDappData(data)
        setIsDappMode(!!data)
    }, [setCurrentDappData, setIsDappMode])

    const addCustomDapp = useCallback((dapp: DappManifestData) => {
        const exists = customDapps.find(x => x.url === dapp.url)
        if (!exists) {
            updateCustomDapps([...customDapps, { ...dapp }])
        }
    }, [customDapps, updateCustomDapps])

    const removeCustomDapp = useCallback((dapp: DappManifestData) => {
        const index = customDapps.findIndex(x => x.url === dapp.url)
        if (index >= 0) {
            updateCustomDapps([...customDapps].splice(index, 1))
        }
    }, [customDapps, updateCustomDapps])

    const toggleFavorite = useCallback((dapp: DappManifestData) => {
        const updated = { ...favorites }
        if (updated[dapp.url]) {
            delete updated[dapp.url]
        } else {
            updated[dapp.url] = true
        }

        setFavorites(updated)
    }, [favorites, setFavorites])

    const onCategorySelect = useCallback((category: Category) => {
        setCategoryFilter(category)
    }, [])

    const onSearchChange = useCallback((val: string | null) => {
        setSearch(val)
    }, [])


    // refresh list from filters
    useEffect(() => {
        setFilteredItems(catalog.filter(item => {
            let match = true
            if (categoryFilter) {
                match = categoryFilter.filter(item, favorites)
            }
            if (search && match) {
                match = item.name.toLowerCase().includes(search?.toLowerCase())
            }
            return match
        }))
    }, [catalog, search, categoryFilter, favorites])

    return {
        isDappMode,
        sideBarOpen,
        currentDappData,
        toggleDappMode,
        toggleSideBarOpen,
        loadCurrentDappData,
        addCustomDapp,
        removeCustomDapp,
        catalog,
        favorites,
        toggleFavorite,
        filteredCatalog,
        onCategorySelect,
        search,
        onSearchChange,
        categories,
        categoryFilter
    }
}