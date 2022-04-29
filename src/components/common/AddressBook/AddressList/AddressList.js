import './AddressList.scss'

import { MdOutlineDelete } from 'react-icons/md'

const AddressList = ({ noAccounts, addresses, onSelectAddress, removeAddress }) => {
    const items = addresses.filter(({ isAccount }) => !(isAccount && noAccounts))

    return (
        <div className="address-list">
            {
                !items.length ?
                    <div className="placeholder">Your Address Book is empty</div>
                    :
                    items.map(({ isAccount, icon, name, address, isUd = false }) => (
                        <div className="item" key={address + name}>
                            <div className="inner" onClick={() => onSelectAddress && onSelectAddress(address)}>
                                <div className="icon" style={{ backgroundImage: `url(${icon})`}}></div>
                                <div className="details">
                                    <label>{ name }</label>
                                    <div className="address">{ address }</div>
                                </div>
                            </div>
                            {
                                !isAccount ? 
                                    <div className="button" onClick={() => removeAddress(name, address, isUd)}>
                                        <MdOutlineDelete/>
                                    </div>
                                    :
                                    null
                            }
                        </div>
                    ))
            }
        </div>
    )
}

export default AddressList