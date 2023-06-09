import { useEffect, useState, useCallback, useRef } from 'react'

import usePrevious from 'ambire-common/src/hooks/usePrevious'

export default function useCacheStorage({ key, data: { accounts } }) {
  const db = useRef()
  const prevAccounts = usePrevious(accounts)

  const [assets, setAssets] = useState({})
  const [isInitializing, setIsInitializing] = useState(true)

  const openDatabase = useCallback(async () => {
    const indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB ||
      window.shimIndexedDB

    if (!indexedDB) {
      setIsInitializing(false)
      throw new Error('IndexedDB could not be found in this browser.')
    }
    const request = await indexedDB.open(key, 1)
    setIsInitializing(true)

    request.onsuccess = async () => {
      db.current = request.result
      if (db.current.objectStoreNames.length && db.current.objectStoreNames.contains('assets')) {
        const transaction = await request.result.transaction('assets', 'readwrite')

        const store = await transaction.objectStore('assets').getAll()
        store.onsuccess = async () => {
          const res = store.result.reduce((acc, cur) => {
            acc[cur.key] = cur
            return acc
          }, {})

          setAssets((prev) => ({ ...prev, ...res }))
          setIsInitializing(false)
        }
      } else {
        setIsInitializing(false)
      }
    }
    request.onerror = async () => {
      setIsInitializing(false)
    }
    request.onupgradeneeded = async (event) => {
      db.current = request.result
      await db.current.createObjectStore('assets', { keyPath: 'key' })
      const transaction = event.target.transaction

      transaction.oncomplete = () => {
        setIsInitializing(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    openDatabase()
  }, [key, openDatabase])

  const removeAssetsByAccoundId = useCallback(
    async (clearedAccounts) => {
      if (
        !db.current ||
        !db.current.objectStoreNames ||
        !db.current.objectStoreNames.contains('assets')
      )
        return

      const transaction = await db.current.transaction('assets', 'readwrite')
      const store = await transaction.objectStore('assets')
      clearedAccounts.map(async ({ id }) => {
        Object.keys(assets)
          .filter((key) => key.includes(id))
          .map(async (assetKey) => {
            const request = await store.delete(assetKey)
            request.onsuccess = async () => {
              console.log(`Account cache deleted, id: ${assetKey}`)
            }
            request.onerror = async (err) => {
              throw new Error(`Error to delete account: ${err}`)
            }
          })
      })
    },
    [assets]
  )

  // Check for removed accounts and remove cached data
  useEffect(() => {
    const clearedAccounts =
      prevAccounts &&
      prevAccounts?.length &&
      prevAccounts.filter((acc) => !accounts.find((prevAcc) => acc.id === prevAcc.id))

    if (clearedAccounts && clearedAccounts.length) {
      removeAssetsByAccoundId(clearedAccounts)
    }
  }, [accounts, prevAccounts, removeAssetsByAccoundId])

  // SET
  const setAssetsByAccount = async (value) => {
    setAssets((prevState) => {
      const itemValue = typeof value === 'function' ? value(prevState) : value
      return itemValue
    })

    if (
      !db.current ||
      !db.current.objectStoreNames ||
      !db.current.objectStoreNames.contains('assets')
    )
      return

    const transaction = await db.current.transaction('assets', 'readwrite')
    const store = await transaction.objectStore('assets')
    const storeAssets = await store.getAll()

    storeAssets.onsuccess = async () => {
      const assetsDb = storeAssets.result.reduce((acc, cur) => {
        acc[cur.key] = cur
        return acc
      }, {})

      if (typeof value === 'function') {
        const updatedItemsByKeys = value(store)
        const allPassedAssets = value(assetsDb)
        Object.keys(updatedItemsByKeys).forEach(async (key) => {
          const request = await store.get(key)

          request.onerror = async (e) => {
            // Handle errors!
            console.error('Error saving data in idexedDb', e)
          }
          request.onsuccess = async (event) => {
            // Get the old value that we want to update
            let data = event.target.result

            // update the value(s) in the object that you want to change
            data = { key, ...allPassedAssets[key] }

            // Put this updated object back into the database.
            store.put(data)
          }
        })
      } else {
        const key = Object.keys(value)
        const request = await store.get(key)

        request.onerror = async (e) => {
          console.error('Error saving data in idexedDb', e)
        }
        request.onsuccess = async (event) => {
          // Get the old value that we want to update
          let data = await event.target.result

          // update the value(s) in the object that you want to change
          data = { key, ...value }
          // Put this updated object back into the database.
          store.put(data)
        }
      }
    }

    storeAssets.onerror = async (e) => {
      console.error('Error saving data in idexedDb', e)
    }
  }

  return [assets, setAssetsByAccount, isInitializing]
}
