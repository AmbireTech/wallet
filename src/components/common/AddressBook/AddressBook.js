import './AddressBook.scss'

import { FaAddressCard } from 'react-icons/fa'
import { MdOutlineAdd, MdClose } from 'react-icons/md'
import { Button, DropDown, TextInput } from 'components/common'
import { useCallback, useEffect, useRef, useState } from 'react'
import AddressList from './AddressList/AddressList'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { resolveENSDomain, getBip44Items, isEnsDomain } from 'lib/ensDomains'

const AddressBook = ({ addresses, addAddress, removeAddress, newAddress, onClose, onSelectAddress, selectedNetwork }) => {
    const [address, setAddress] = useState('')
    const [name, setName] = useState('')
    const [isOpen, setOpenMenu] = useState(false)
    const [openAddAddress, setOpenAddAddress] = useState(false)
    const timer = useRef(null)
    const [uDAddress, setUDAddress] = useState('')
    const [ensAddress, setEnsAddress] = useState('')

    const selectAddress = address => {
        onSelectAddress && onSelectAddress(uDAddress ? uDAddress : address)
        setOpenMenu(false)
    }

    const isAddAddressFormValid = ((address.length && name.length && /^0x[a-fA-F0-9]{40}$/.test(uDAddress ? uDAddress : address) || isEnsDomain(address) && ensAddress))
    const onAddAddress = useCallback(() => {
        setOpenMenu(false)
        setOpenAddAddress(false)
        addAddress(name, address, uDAddress ? true : false)
    }, [addAddress, name, address, uDAddress])

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
            if (!isEnsDomain(address)) {
                const UDAddress = await resolveUDomain(address, null, selectedNetwork.unstoppableDomainsChain)

                if (UDAddress) {
                    setUDAddress(UDAddress)
                } else {
                    setUDAddress('')
                }

            }
            else {
                const ensAddress = await resolveENSDomain(address)
                if(ensAddress) {
                    setEnsAddress(ensAddress)
                }
                else {
                    setAddress("Ens domain couldn't be resolved")
                }
            }
            timer.current = null
        }

        timer.current = setTimeout(async () => {
            return validateForm().catch(console.error)
        }, 500)
    }, [address, selectedNetwork.unstoppableDomainsChain])

    return (
        <DropDown title={<><FaAddressCard />Address Book</>} className="address-book" open={isOpen} onChange={onDropDownChange}>
            <div className="heading">
                <div className="title">
                    <FaAddressCard /> Address Book
                </div>
                {
                    !openAddAddress ?
                        <div className="button" onClick={() => setOpenAddAddress(true)}>
                            <MdOutlineAdd />
                        </div>
                        :
                        <div className="button" onClick={() => setOpenAddAddress(false)}>
                            <MdClose />
                        </div>
                }
            </div>
            {
                openAddAddress ?
                    <div id="add-address" className="content">
                        <div className="fields">
                            <TextInput autoComplete="nope" placeholder="Name" value={name} onInput={value => setName(value)} />
                            <TextInput autoComplete="nope" placeholder="Address" value={address} onInput={value => setAddress(value)} />
                        </div>
                        <Button clear small disabled={!isAddAddressFormValid} onClick={onAddAddress}>
                            <MdOutlineAdd /> Add Address
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