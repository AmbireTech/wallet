import { useCallback, useEffect, useMemo, useState } from 'react'
import { uuid } from 'uuidv4';
import { useToasts } from './toasts'
import * as blockies from 'blockies-ts'
import { isValidAddress, isKnownTokenOrContract } from '../helpers/address'
import { setKnownAddresses } from '../lib/humanReadableTransactions'

const accountType = ({ email, signerExtra }) => {
    const walletType = signerExtra && signerExtra.type === 'ledger' ? 'Ledger' : signerExtra && signerExtra.type === 'trezor' ? 'Trezor' : 'Web3'
    return email ? `Ambire account for ${email}` : `Ambire account (${walletType})`
}
const toIcon = seed => blockies.create({ seed }).toDataURL()

const useAddressBook = ({ accounts }) => {
    const { addToast } = useToasts()

    const addressList = useMemo(() => {
        try {
            const addresses = JSON.parse(localStorage.addresses || '[]')
            if (!Array.isArray(addresses)) throw new Error('Address Book: incorrect format')
            return [
                ...accounts.map(account => ({
                    isAccount: true,
                    name: accountType(account),
                    address: account.id,
                    icon: toIcon(account.id)
                })),
                ...addresses.map(entry => ({
                    ...entry,
                    icon: toIcon(entry.address)
                }))
            ]
        } catch (e) {
            console.error('Address Book parsing failure', e)
            return []
        }
    }, [accounts])

    const [addresses, setAddresses] = useState(() => addressList)

    const updateAddresses = addresses => {
        setAddresses(addresses.map(entry => ({
            ...entry,
            icon: toIcon(entry.address)
        })))
        localStorage.addresses = JSON.stringify(addresses.filter(({ isAccount }) => !isAccount))
    }

    const isKnownAddress = useCallback(address => [
        ...addresses.map(({ address }) => address),
        ...accounts.map(({ id }) => id)
    ].includes(address), [addresses, accounts])

    const addAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')
        if (isKnownTokenOrContract(address)) return addToast('The address you\'re trying to add is a smart contract.', { error: true })

        const newAddresses = [
            ...addresses,
            {
                id: uuid(),
                name,
                address
            }
        ]

        updateAddresses(newAddresses)

        addToast(`${address} added to your Address Book.`)
    }, [addresses, addToast])

    const updateAddress = useCallback((id, fields) => {
        if (!id) throw new Error('Address Book: invalid arguments supplied')

        const entry = addresses.find(a => a.id === id)
        if (!entry) throw new Error(`Address Book: address with id ${id} does not exists`)

        const filteredAddresses = addresses.filter(a => !(a.id === id))
        updateAddresses([
            ...filteredAddresses,
            {
                ...entry,
                ...fields
            }
        ])

        addToast(`${entry.name} (${entry.address}) address updated.`)
    }, [addresses, addToast])

    const removeAddress = useCallback(id => {
        if (!id) throw new Error('Address Book: invalid arguments supplied')

        const newAddresses = addresses.filter(a => !(a.id === id))
        updateAddresses(newAddresses)

        addToast(`Removed from your Address Book.`)
    }, [addresses, addToast])

    useEffect(() => { setAddresses(addressList) }, [accounts, addressList])

    // a bit of a 'cheat': update the humanizer with the latest known addresses
    // this is breaking the react patterns cause the humanizer has a 'global' state, but that's fine since it simply constantly learns new addr aliases,
    // so there's no 'inconsistent state' there, the more the better
    useEffect(() => setKnownAddresses(addresses), [addresses])

    return {
        addresses,
        addAddress,
        updateAddress,
        removeAddress,
        isKnownAddress
    }
}

export default useAddressBook