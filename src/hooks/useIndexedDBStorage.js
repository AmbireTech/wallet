import { useEffect, useState, useRef } from 'react'

export default function useIndexedDBStorage({ dbName, version }) {
    const [items, setItemsLocally] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [shouldStartFetching, setShouldStartFetching] = useState(false)

    const isFirstRender = useRef(true)
    let db = useRef()

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const indexedDB =
                window.indexedDB ||
                window.mozIndexedDB ||
                window.webkitIndexedDB ||
                window.msIndexedDB ||
                window.shimIndexedDB;
    
            if (!indexedDB) {
                console.log("IndexedDB could not be found in this browser.");
                reject()
                return;
            }
            const request = indexedDB.open(dbName, version);
            setIsLoading(true)
    
            request.onsuccess = (event) => {
                db.current = request.result;
                if (db.current.objectStoreNames.length && db.current.objectStoreNames.contains("assets")) {
                    const transaction = request.result.transaction("assets", "readwrite");
                    
                    const store = transaction.objectStore("assets").getAll();
                    store.onsuccess = function () {
                        const res = store.result.reduce(function(acc, cur) {
                            acc[cur.key] = cur;
                            return acc;
                        }, {});
                        setItemsLocally(prev => ({...prev, ...res}))
                        resolve(db.current)
                    }
    
                } else {
                    setItemsLocally({})
                    resolve(db.current)
                }
            };
            request.onerror = (event) => {
                setIsLoading(false)
                reject(`IndexedDB error: ${request.error}`);
            };
            request.onupgradeneeded = (event) => {
                console.log(request.result)
                db.current = request.result;
                db.current.createObjectStore("assets", { keyPath: "key" });
                setIsLoading(false)
                setItemsLocally({})
                resolve(db.current)
            };
        });
    }

    useEffect(() => {
        openDatabase()
    }, [dbName, version])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return
        }
        setIsLoading(false)

        if (Object.keys(items).length) {
            setTimeout(() => {
                setShouldStartFetching(true)
            }, 10000)
        } else {
            setShouldStartFetching(true)
        }

    }, [items])

    // GET

    // SET
    const setItems = async ({ assetsByAccount, key }) => {
        if (!db.current) {
            await openDatabase().then(_db => {
                debugger
                const transaction = _db.transaction("assets", "readwrite");
                const store = transaction.objectStore('assets');
                store.put({ key: key, ...assetsByAccount})
                setItemsLocally(prev => ({
                    ...prev,
                    [key]: {
                        ...prev[key],
                        ...assetsByAccount
                    }
                }))
            })
        }
        
        if (!db.current || !db.current.objectStoreNames || !db.current.objectStoreNames.contains("assets")) return

        const transaction = db.current.transaction("assets", "readwrite");
        const store = transaction.objectStore('assets');
        store.put({ key: key, ...assetsByAccount})
        setItemsLocally(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                ...assetsByAccount
            }
        }))
    }

    // Return items, getItems, setItems, remove
   return [items, setItems, isLoading, shouldStartFetching]
}