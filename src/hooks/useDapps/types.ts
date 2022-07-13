
export type UseStorageProps<ValueType> = {
    storage: Storage
    key: string
    defaultValue?: ValueType | null
    isStringStorage?: boolean
    setInit?: (item: ValueType | null) => ValueType
}

export type UseStorageReturnType<ValueType> = [ValueType, (item: ValueType) => void, () => void]

export type UseStorageType = <ValueType>(
    p: Omit<UseStorageProps<ValueType>, 'storage'>
) => UseStorageReturnType<ValueType>


// TODO: import storage types when added to ambire-common

export type UseDappsProps = {
    useStorage: UseStorageType
}

export type DappType =
    | 'integrated'
    | 'walletconnect'
    | 'custom'

// TODO: extend gnosis manifest and add ambire wallet specific props
export interface DappManifestData {
    name: string,
    title: string,
    url: string,
    logo: string,
    description: string,
    type: DappType,
    networks: Array<string>,
}

export type DappCatalog = Array<DappManifestData>

export type Category = {
    name: string,
    filter: (x: any, y?: any) => boolean
}

export type UseDappsReturnType = {
    isDappMode: boolean,
    sideBarOpen: boolean,
    currentDappData: DappManifestData,
    toggleDappMode: () => void,
    toggleSideBarOpen: () => void,
    loadCurrentDappData: (data: DappManifestData) => void,
    addCustomDapp: (dapp: DappManifestData) => void,
    removeCustomDapp: (dapp: DappManifestData) => void,
    favorites: { [key: string]: boolean },
    toggleFavorite: (dapp: DappManifestData) => void,
    catalog: Array<DappManifestData>,
    filteredCatalog: Array<DappManifestData>,
    onCategorySelect: (category: Category) => void,
    search: string | null,
    onSearchChange: (value: string | null) => void,
    categories: Array<Category>
    categoryFilter: Category
}