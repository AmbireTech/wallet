import './AddressList.scss'

import { MdOutlineDelete } from 'react-icons/md'

const AddressList = ({ addresses, onSelectAddress, removeAddress }) => {
    return (
        <div className="address-list">
            {
                addresses.map(({ isAccount, icon, name, address }) => (
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
                                <div className="button" onClick={() => removeAddress(name, address)}>
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