import './Accounts.scss'

import * as blockies from 'blockies-ts';
import { AiOutlinePlus } from 'react-icons/ai'
import { NavLink } from 'react-router-dom';
import { DropDown, Button } from '../../../common';

const Accounts = ({ accounts, selectedAddress, onSelectAcc }) => {
    const shortenedAddress = address => address.slice(0, 5) + '...' + address.slice(-3)
    const isActive = id => id === selectedAddress ? 'active' : ''
    const toIcon = seed => blockies.create({ seed }).toDataURL()
    const toIconBackgroundImage = seed => ({ backgroundImage: `url(${toIcon(seed)})`})
    const walletType = signerExtra => {
        if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
        else if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
        else return 'Web3'
    } 

    return (
        <DropDown id="accounts" icon={toIcon(selectedAddress)} title={shortenedAddress(selectedAddress)} closeOnClick>
          <div className="list">
            {
              accounts.map(({ id, email, signer, signerExtra }) => (
                <div className={`account ${isActive(id)}`} key={id} onClick={() => onSelectAcc(id)}>
                  <div className="icon" style={toIconBackgroundImage(id)}></div>
                  <div className="details">
                    <div className="address">{ id }</div>
                    <label>{ email ? `Email/passphrase account (${email})` : `${walletType(signerExtra)} (${shortenedAddress(signer.address)})` }</label>
                  </div>
                </div>
              ))
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