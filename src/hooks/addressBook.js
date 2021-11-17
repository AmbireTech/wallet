import { useCallback, useEffect, useState } from 'react'
import { useToasts } from './toasts'

const isAddressValid = address => /^0x[a-fA-F0-9]{40}$/.test(address)

const storeItem = (key, value) => {
    localStorage.setItem(key, value)
    const event = new Event('storage');
    event.value = value;
    event.key = key;
    window.dispatchEvent(event);
}

const useAddressBook = () => {
    const { addToast } = useToasts()

    const [addresses, setAddresses] = useState(() => {
        try {
            const addresses = JSON.parse(localStorage.addresses || '[]')
            if (!Array.isArray(addresses)) throw new Error('Address Book: incorrect format')
            return addresses
        } catch (e) {
            console.error('Address Book parsing failure', e)
            return []
        }
    })

    const addAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isAddressValid(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = [
            ...addresses,
            {
                name,
                address
            }
        ]

        setAddresses(newAddresses)
        storeItem('addresses', JSON.stringify(newAddresses))

        addToast(`${address} added to your Address Book.`)
    }, [addresses, addToast])

    const removeAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isAddressValid(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = addresses.filter(a => JSON.stringify(a) !== JSON.stringify({ name, address }))

        setAddresses(newAddresses)
        storeItem('addresses', JSON.stringify(newAddresses))

        addToast(`${address} removed from your Address Book.`)
    }, [addresses, addToast])

    useEffect(() => {
        const onReceieveMessage = ({ key, value }) => {
            if (key === 'addresses') setAddresses(JSON.parse(value))
        }
        window.addEventListener('storage', onReceieveMessage)
        return () => window.removeEventListener('storage', onReceieveMessage)
    }, [])

    return {
        addresses,
        addAddress,
        removeAddress
    }
}

export default useAddressBook