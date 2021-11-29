import './AddressBook.scss'

import { FaAddressCard } from 'react-icons/fa'
import { MdOutlineAdd, MdClose } from 'react-icons/md'
import { DropDown } from '..'
import { useCallback, useEffect, useState } from 'react'
import AddressList from './AddressList/AddressList'

const AddressBook = ({ addresses, addAddress, removeAddress, newAddress, onClose, onSelectAddress }) => {
    const [address, setAddress] = useState('')
    const [name, setName] = useState('')
    const [isOpen, setOpenMenu] = useState(false)
    const [openAddAddress, setOpenAddAddress] = useState(false)

    const selectAddress = address => onSelectAddress ? onSelectAddress(address) : null
    
    const isAddAddressFormValid = address.length && name.length && /^0x[a-fA-F0-9]{40}$/.test(address)
    const onAddAddress = useCallback(() => {
        setOpenAddAddress(false)
        addAddress(name, address)
    }, [name, address, addAddress])

    const onMenuClose = useCallback(() => {
        setName('')
        setAddress('')
        setOpenMenu(false)
    }, [])

    useEffect(() => !isOpen && onClose ? onClose() : null, [isOpen, onClose])

    useEffect(() => {
        if (newAddress) {
            setAddress(newAddress)
            setOpenMenu(true)
            setOpenAddAddress(true)
        }
    }, [newAddress])

    return (
        <DropDown title={<><FaAddressCard/>Address Book</>} className="address-book" open={isOpen} onClose={onMenuClose}>
            <div className="heading">
                <div className="title">
                    <FaAddressCard/> Address Book
                </div>
                {
                    !openAddAddress ?
                        <div className="button" onClick={() => setOpenAddAddress(true)}>
                            <MdOutlineAdd/>
                        </div>
                        :
                        <div className="button" onClick={() => setOpenAddAddress(false)}>
                            <MdClose/>
                        </div>
                }
            </div>
            {
                openAddAddress ?
                    <div id="add-address" className="content">
                        <div className="fields">
                            <input type="text" autoComplete="nope" placeholder="Name" defaultValue={name} onInput={({ target }) => setName(target.value)}/>
                            <input type="text" autoComplete="nope" placeholder="Address" defaultValue={address} onInput={({ target }) => setAddress(target.value)}/>
                        </div>
                        <button className="button" disabled={!isAddAddressFormValid} onClick={onAddAddress}>
                            <MdOutlineAdd/> Add Address
                        </button>
                    </div>
                    :
                    !addresses.length ?
                        <div className="content">
                            Your Address Book is empty.
                        </div>
                        :
                        <div className="content">
                            <AddressList
                                addresses={addresses}
                                onSelectAddress={selectAddress}
                                removeAddress={removeAddress}
                            />
                        </div>
            }
        </DropDown>
    )
}

export default AddressBook