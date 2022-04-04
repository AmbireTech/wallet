import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToasts } from './toasts'
import * as blockies from 'blockies-ts'
import { isValidAddress, isKnownTokenOrContract } from 'lib/address'
import { setKnownAddresses } from 'lib/humanReadableTransactions'
import { sha256 } from 'ethers/lib/utils'

const accountType = ({ email, signerExtra }) => {
    const walletType = signerExtra && signerExtra.type === 'ledger' ? 'Ledger' : signerExtra && signerExtra.type === 'trezor' ? 'Trezor' : 'Web3'
    return email ? `Ambire account for ${email}` : `Ambire account (${walletType})`
}
const toIcon = seed => blockies.create({ seed }).toDataURL()

const useAddressBook = ({ accounts, useStorage }) => {
    const { addToast } = useToasts()
    const [storageAddresses, setStorageAddresses] = useStorage({ key: 'addresses', defaultValue: [] })

    const addressList = useMemo(() => {
        try {
            const addresses = storageAddresses
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
    }, [accounts, storageAddresses])

    const [addresses, setAddresses] = useState(() => addressList)

    const updateAddresses = useCallback(addresses => {
        setAddresses(addresses.map(entry => ({
            ...entry,
            icon: toIcon(entry.address)
        })))
        setStorageAddresses(addresses.filter(({ isAccount }) => !isAccount))
    }, [setAddresses, setStorageAddresses])

    const isKnownAddress = useCallback(address => {
        if (!address.startsWith('0x')) return true
        return [
            ...addresses.map(({ address }) => sha256(address)),
            ...accounts.map(({ id }) => sha256(id))
        ].includes(sha256(address))
    }, [addresses, accounts])

    const addAddress = useCallback((name, address, isUd = false) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isUd) {
            if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')
            if (isKnownTokenOrContract(address)) return addToast('The address you\'re trying to add is a smart contract.', { error: true })
        }
        
        const newAddresses = [
            ...addresses,
            {
                name,
                address,
                isUd
            }
        ]

        updateAddresses(newAddresses)

        addToast(`${address} added to your Address Book.`)
    }, [addresses, addToast, updateAddresses])

    const removeAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = addresses
            .filter(a => !(a.name === name && a.address === address))

        updateAddresses(newAddresses)

        addToast(`${address} removed from your Address Book.`)
    }, [addresses, addToast, updateAddresses])

    useEffect(() => { setAddresses(addressList) }, [accounts, addressList])

    // a bit of a 'cheat': update the humanizer with the latest known addresses
    // this is breaking the react patterns cause the humanizer has a 'global' state, but that's fine since it simply constantly learns new addr aliases,
    // so there's no 'inconsistent state' there, the more the better
    useEffect(() => setKnownAddresses(addresses), [addresses])

    return {
        addresses,
        addAddress,
        removeAddress,
        isKnownAddress
    }
}

export default useAddressBook
