const storeItem = (key, value) => {
    localStorage.setItem(key, value)

    const storageEvent = new Event(`storage`);
    storageEvent.key = key
    storageEvent.value = value
    window.dispatchEvent(storageEvent);

    const keyStorageEvent = new Event(`storage.${key}`);
    keyStorageEvent.value = value;
    window.dispatchEvent(keyStorageEvent);
}

export default storeItem