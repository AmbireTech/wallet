import { useState, useCallback, useMemo, useEffect } from 'react'
import { UseDappModeProps, UseDappModeReturnType, DappManifestData, Category } from './types'
import { DEFAULT_CATALOG } from './catalogs'


const CATEGORIES: Array<Category> = [
    {
        name: 'all',
        filter: (f: any) => f
    },
    {
        name: 'integrated',
        filter: (f: any) => f.type === 'integrated'
    },
    {
        name: 'walletconnect',
        filter: (f: any) => f.type === 'walletconnect'
    },
    {
        name: 'favorites',
        filter: (f: any, faves: object) => Object.keys(faves).indexOf(f.name) !== -1
    }
]

export default function useDappMode({ useStorage }: UseDappModeProps): UseDappModeReturnType {

    const categories = useMemo(() => CATEGORIES, [])

    const [isDappMode, setIsDappMode] = useStorage<boolean>({ key: 'isDappMode' })
    const [sideBarOpen, setSideBarOpen] = useState(false)
    const [currentDappData, setCurrentDappData] = useStorage<DappManifestData>({ key: 'currentDappData' })
    const [customDapps, updateCustomDapps] = useStorage<Array<DappManifestData>>({ key: 'customDapps', defaultValue: [] })

    const [search, setSearch] = useState<string | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<Category>(categories[0])
    const [favorites, setFavorites] = useStorage<{ [key: string]: boolean }>({
        key: 'dappCatalog-faves',
        defaultValue: {},
    })


    const catalog = useMemo(() =>
        [...DEFAULT_CATALOG, ...customDapps]
        , [customDapps])

    const [filteredCatalog, setFilteredItems] = useState(catalog)

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
                match = item.title.toLowerCase().includes(search?.toLowerCase())
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