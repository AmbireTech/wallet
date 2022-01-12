import './AddressBook.scss'

import { FaAddressCard } from 'react-icons/fa'
import { MdOutlineAdd, MdClose } from 'react-icons/md'
import { Button, DropDown, TextInput } from 'components/common'
import { useCallback, useEffect, useState } from 'react'
import AddressList from './AddressList/AddressList'

const AddressBook = ({ addresses, addAddress, removeAddress, newAddress, onClose, onSelectAddress }) => {
    const [address, setAddress] = useState('')
    const [name, setName] = useState('')
    const [isOpen, setOpenMenu] = useState(false)
    const [openAddAddress, setOpenAddAddress] = useState(false)

    const selectAddress = address => {
        onSelectAddress && onSelectAddress(address)
        setOpenMenu(false)
    }
    
    const isAddAddressFormValid = address.length && name.length && /^0x[a-fA-F0-9]{40}$/.test(address)
    const onAddAddress = useCallback(() => {
        setOpenMenu(false)
        setOpenAddAddress(false)
        addAddress(name, address)
    }, [name, address, addAddress])

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

    return (
        <DropDown title={<><FaAddressCard/>Address Book</>} className="address-book" open={isOpen} onChange={onDropDownChange}>
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
                            <TextInput autoComplete="nope" placeholder="Name" value={name} onInput={value => setName(value)}/>
                            <TextInput autoComplete="nope" placeholder="Address" value={address} onInput={value => setAddress(value)}/>
                        </div>
                        <Button clear small disabled={!isAddAddressFormValid} onClick={onAddAddress}>
                            <MdOutlineAdd/> Add Address
                        </Button>
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