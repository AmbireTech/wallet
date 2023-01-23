import { useCallback, useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import { resolveENSDomain } from 'lib/ensDomains'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { Button, DropDown, TextInput } from 'components/common'
import Addresses from './Addresses/Addresses'

import { FaAddressCard } from 'react-icons/fa'
import { MdOutlineAdd, MdClose } from 'react-icons/md'
import { ReactComponent as AddressBookIcon } from './images/address-book.svg'

import styles from './AddressBook.module.scss'

const AddressBook = ({ addresses, addAddress, removeAddress, newAddress, onClose, onSelectAddress, selectedNetwork, className }) => {
    const [address, setAddress] = useState('')
    const [name, setName] = useState('')
    const [isOpen, setOpenMenu] = useState(false)
    const [openAddAddress, setOpenAddAddress] = useState(false)
    const timer = useRef(null)
    const [uDAddress, setUDAddress] = useState('')
    const [ensAddress, setEnsAddress] = useState('')

    const selectAddress = address => {
        onSelectAddress && onSelectAddress(uDAddress ? uDAddress : ensAddress ? ensAddress : address)
        setOpenMenu(false)
    }

    const isAddAddressFormValid = (address.length && name.length && /^0x[a-fA-F0-9]{40}$/.test(uDAddress ? uDAddress : ensAddress ? ensAddress : address))
    const onAddAddress = useCallback(() => {
        setOpenMenu(false)
        setOpenAddAddress(false)
        addAddress(name, address, uDAddress ? { type: 'ud' } : ensAddress ? { type: 'ens' } : { type: 'pub' })
    }, [addAddress, name, address, uDAddress, ensAddress])

    const onDropDownChange = useCallback(state => {
        setOpenMenu(state)
        if (!state) {
            setName('')
            setAddress('')
        }
    }, [])

    useEffect(() => !isOpen && onClose ? onClose() : null, [isOpen, onClose])

    useEffect(() => {
        if (newAddress) {
            setAddress(newAddress)
            setOpenMenu(true)
            setOpenAddAddress(true)
        }
    }, [newAddress])

    useEffect(() => {
        if (timer.current) {
            clearTimeout(timer.current)
        }

        const validateForm = async () => {
            const UDAddress = await resolveUDomain(address, null, selectedNetwork.unstoppableDomainsChain)
            const ensAddress = await resolveENSDomain(address)

            if (UDAddress) setUDAddress(UDAddress)
            else if (ensAddress) setEnsAddress(ensAddress)
            else {
                setUDAddress('')
                setEnsAddress('')
            }
            
            timer.current = null
        }

        timer.current = setTimeout(async () => {
            return validateForm().catch(console.error)
        }, 500)
    }, [address, selectedNetwork.unstoppableDomainsChain])

    return (
        <DropDown title={<><AddressBookIcon />Address Book</>} className={cn(styles.addressBook, className || '')} menuClassName={styles.menu} handleClassName={styles.handle} open={isOpen} onChange={onDropDownChange}>
            <div className={styles.heading}>
                <div className={styles.title}>
                    <FaAddressCard /> Address Book
                </div>
                {
                    !openAddAddress ?
                        <div className={styles.button} onClick={() => setOpenAddAddress(true)}>
                            <MdOutlineAdd />
                        </div>
                        :
                        <div className={styles.button} onClick={() => setOpenAddAddress(false)}>
                            <MdClose />
                        </div>
                }
            </div>
            {
                openAddAddress ?
                    <div className={cn(styles.addAddress, styles.content)}>
                        <div className={styles.fields}>
                            <TextInput autoComplete="nope" placeholder="Name" value={name} onInput={value => setName(value)} />
                            <TextInput autoComplete="nope" placeholder="Address" value={address} onInput={value => setAddress(value)} />
                        </div>
                        <Button clear small disabled={!isAddAddressFormValid} onClick={onAddAddress}>
                            <MdOutlineAdd /> Add Address
                        </Button>
                    </div>
                    :
                    !addresses.length ?
                        <div className={styles.content}>
                            <p className={styles.emptyText}>Your Address Book is empty.</p>
                        </div>
                        :
                        <div className={styles.content}>
                            <Addresses
                                addresses={addresses}
                                onSelectAddress={selectAddress}
                                removeAddress={removeAddress}
                                addressClassName={styles.address}
                            />
                        </div>
            }
        </DropDown>
    )
}

export default AddressBook