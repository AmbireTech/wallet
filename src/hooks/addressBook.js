import { useCallback, useState } from 'react'
import { useToasts } from './toasts'

const isAddressValid = address => /^0x[a-fA-F0-9]{40}$/.test(address)

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
                id: address,
                name
            }
        ]

        setAddresses(newAddresses)
        localStorage.addresses = JSON.stringify(newAddresses)

        addToast(`${address} added to your Address Book.`)
    }, [addresses])

    const removeAddress = useCallback(address => {
        if (!isAddressValid(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = addresses.filter(({ id }) => id !== address)

        setAddresses(newAddresses)
        localStorage.addresses = JSON.stringify(newAddresses)

        addToast(`${address} removed from your Address Book.`)
    }, [addresses])

    return {
        addresses,
        addAddress,
        removeAddress
    }
}

export default useAddressBook