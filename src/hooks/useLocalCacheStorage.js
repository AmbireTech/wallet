import { useState } from 'react'

// In case browser doesnt support indexedDB for caching
export default function useLocalCacheStorage() {
  const [assets, setAssets] = useState({})
  const isInitializing = false
  const hasActiveCache = false

  const setAssetsByAccount = async (value) => {
    setAssets((prevState) => {
      const itemValue = typeof value === 'function' ? value(prevState) : value
      return itemValue
    })
  }

  return [assets, setAssetsByAccount, isInitializing, hasActiveCache]
}
