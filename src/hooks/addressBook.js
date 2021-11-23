import { useCallback, useState } from 'react'
import { useToasts } from './toasts'
import * as blockies from 'blockies-ts';
import { names, tokens } from '../consts/humanizerInfo'

const accountType = ({ email, signerExtra }) => {
    const walletType = signerExtra && signerExtra.type === 'ledger' ? 'Ledger' : signerExtra && signerExtra.type === 'trezor' ? 'Trezor' : 'Web3'
    return email ? `Ambire account for ${email}` : `Ambire account (${walletType})`
}
const toIcon = seed => blockies.create({ seed }).toDataURL()

const isKnownTokenOrContract = address => {
    const addressToLowerCase = address.toLowerCase()
    const tokensAddresses = Object.keys(tokens)
    const contractsAddresses = Object.keys(names)
    return tokensAddresses.includes(addressToLowerCase) || contractsAddresses.includes(addressToLowerCase)
}

const useAddressBook = ({ accounts, selectedAcc }) => {
    const { addToast } = useToasts()

    const [addresses, setAddresses] = useState(() => {
        try {
            const addresses = JSON.parse(localStorage.addresses || '[]')
            if (!Array.isArray(addresses)) throw new Error('Address Book: incorrect format')
            return [
                ...accounts.filter(({ id }) => id !== selectedAcc).map(account => ({
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
    })

    const updateAddresses = addresses => {
        setAddresses(addresses.map(entry => ({
            ...entry,
            icon: toIcon(entry.address)
        })))
        localStorage.addresses = JSON.stringify(addresses.filter(({ isAccount }) => !isAccount))
    }

    const isValidAddress = useCallback(address => /^0x[a-fA-F0-9]{40}$/.test(address), [])
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
                name,
                address
            }
        ]

        updateAddresses(newAddresses)

        addToast(`${address} added to your Address Book.`)
    }, [addresses, isValidAddress, addToast])

    const removeAddress = useCallback((name, address) => {
        if (!name || !address) throw new Error('Address Book: invalid arguments supplied')
        if (!isValidAddress(address)) throw new Error('Address Book: invalid address format')

        const newAddresses = addresses
            .filter(a => !(a.name === name && a.address === address))

        updateAddresses(newAddresses)

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