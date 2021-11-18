import { useCallback, useState } from 'react'
import { useToasts } from './toasts'

const useAddressBook = ({ accounts }) => {
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

    const isValidAddress = useCallback(address => /^0x[a-fA-F0-9]{40}$/.test(address), [])
    const isKnownAddress = useCallback(address => [
        ...addresses.map(({ address }) => address),
        ...accounts.map(({ id }) => id)
    ].includes(address), [addresses, accounts])

    const addAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = [
            ...addresses,
            {
                name,
                address
            }
        ]

        setAddresses(newAddresses)
        localStorage.addresses = JSON.stringify(newAddresses)

        addToast(`${address} added to your Address Book.`)
    }, [addresses, isValidAddress, addToast])

    const removeAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = addresses.filter(a => JSON.stringify(a) !== JSON.stringify({ name, address }))

        setAddresses(newAddresses)
        localStorage.addresses = JSON.stringify(newAddresses)

        addToast(`${address} removed from your Address Book.`)
    }, [addresses, isValidAddress, addToast])

    return {
        addresses,
        addAddress,
        removeAddress,
        isValidAddress,
        isKnownAddress
    }
}

export default useAddressBook