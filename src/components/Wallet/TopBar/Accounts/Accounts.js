import './Accounts.scss'

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai'
import { MdOutlineContentCopy, MdLogout, MdOutlineClose, MdOutlineCheck } from 'react-icons/md'
import * as blockies from 'blockies-ts';
import { DropDown, Button } from 'components/common';
import { useToasts } from 'hooks/toasts';

const Accounts = ({ accounts, selectedAddress, onSelectAcc, onRemoveAccount, hidePrivateValue }) => {
    const { addToast } = useToasts()
    const [logoutWarning, setLogoutWarning] = useState(false)
    const [closed, setClosed] = useState(false)

    const shortenedAddress = address => address.slice(0, 5) + '...' + address.slice(-3)
    const isActive = id => id === selectedAddress ? 'active' : ''
    const toIcon = seed => blockies.create({ seed }).toDataURL()
    const toIconBackgroundImage = seed => ({ backgroundImage: `url(${toIcon(seed)})`})
    const walletType = signerExtra => {
        if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
        else if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
        else return 'Web3'
    }
    const copyAddress = async address => {
        await navigator.clipboard.writeText(address)
        addToast('Copied to clipboard!')
    }

    const onSelectAccount = (id) => {
        onSelectAcc(id)
        setClosed(true)
    }

    return (
        <DropDown id="accounts" icon={toIcon(selectedAddress)} title={hidePrivateValue(shortenedAddress(selectedAddress))} open={closed} onOpen={() => setClosed(false)}>
          <div className="list">
            {
              accounts.map(({ id, email, signer, signerExtra }) => 
                logoutWarning !== id ?
                    <div className={`account ${isActive(id)}`} key={id}>
                        <div className="inner" onClick={() => onSelectAccount(id)}>
                            <div className="icon" style={toIconBackgroundImage(id)}></div>
                            <div className="details">
                                <div className="address">{ id }</div>
                                <label>{ email ? `Email/Password account (${email})` : `${walletType(signerExtra)} (${shortenedAddress(signer.address)})` }</label>
                            </div>
                        </div>
                        <div className="buttons">
                            <div className="button" onClick={() => copyAddress(id)}>
                                <MdOutlineContentCopy/>
                            </div>
                            <div className="button" onClick={() => setLogoutWarning(id)}>
                                <MdLogout/>
                            </div>
                        </div>
                    </div>
                    :
                    <div id="confirm-delete-account" className={`account ${isActive(id)}`} key={id}>
                        <div className="message">
                            Are you sure you want to log out from this account ?
                        </div>
                        <div className="buttons">
                            <div className="button danger" onClick={() => {
                                setLogoutWarning(false)
                                onRemoveAccount(id)
                            }}>
                                <MdOutlineCheck/>
                            </div>
                            <div className="button" onClick={() => setLogoutWarning(false)}>
                                <MdOutlineClose/>
                            </div>
                        </div>
                    </div>
              )
            }
          </div>
          <div id="add-account">
            <NavLink to="/add-account">
              <Button icon={<AiOutlinePlus/>} small>Add Account</Button>
            </NavLink>
          </div>
        </DropDown>
    )
}

export default Accounts