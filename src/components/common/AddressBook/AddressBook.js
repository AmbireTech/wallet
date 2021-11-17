import './AddressBook.scss'

import { FaAddressCard } from 'react-icons/fa'
import { MdOutlineAdd, MdClose, MdOutlineDelete } from 'react-icons/md'
import { useAddressBook, useAccounts } from '../../../hooks'
import { DropDown } from '..'
import { useCallback, useEffect, useState } from 'react'

const AddressBook = ({ onSelectAddress }) => {
    const { accounts, selectedAcc } = useAccounts()
    const { addresses, addAddress, removeAddress } = useAddressBook()

    const [address, setAddress] = useState('')
    const [name, setName] = useState('')
    const [openAddAddress, setOpenAddAddress] = useState(false)

    const accountsList = accounts.filter(({ id }) => id !== selectedAcc)
    const accountType = ({ email, signerExtra }) => {
        const walletType = signerExtra && signerExtra.type === 'ledger' ? 'Ledger' : signerExtra && signerExtra.type === 'trezor' ? 'Trezor' : 'Web3'
        return email ? `Ambire account for ${email}` : `Ambire account (${walletType})`
    }
    const selectAddress = address => onSelectAddress ? onSelectAddress(address) : null

    const onAddAddress = useCallback(() => {
        setOpenAddAddress(false)
        addAddress(name, address)
    }, [name, address, addAddress])

    useEffect(() => {
        setAddress('')
        setName('')
    }, [openAddAddress])

    return (
        <DropDown title={<FaAddressCard/>} className="address-book">
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
                    <div className="content">
                        <div className="fields">
                            <input type="text" placeholder="Name" defaultValue={name} onInput={({ target }) => setName(target.value)}/>
                            <input type="text" placeholder="Address" defaultValue={address} onInput={({ target }) => setAddress(target.value)}/>
                        </div>
                        <button className="button" disabled={!name.length || !address.length} onClick={onAddAddress}>
                            <MdOutlineAdd/> Add Address
                        </button>
                    </div>
                    :
                    !addresses.length && !accountsList.length ?
                        <div className="content">
                            Your Address Book is empty.
                        </div>
                        :
                        <div className="content">
                            {
                                <div className="items">
                                    {
                                        addresses.map(({ id, name }) => (
                                            <div className="item" key={id + name} onClick={() => selectAddress(id)}>
                                                <div className="inner">
                                                    <label>{ name }</label>
                                                    <div className="address">{ id }</div>
                                                </div>
                                                <div className="button" onClick={() => removeAddress(id)}>
                                                    <MdOutlineDelete/>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {
                                        accountsList.map(account => (
                                            <div className="item" key={account.id} onClick={() => selectAddress(account.id)}>
                                                <div className="inner">
                                                    <label>{ accountType(account) }</label>
                                                    <div className="address">{ account.id }</div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            }
                        </div>
            }
        </DropDown>
    )
}

export default AddressBook