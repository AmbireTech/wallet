import './Accounts.scss'

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai'
import { MdOutlineContentCopy, MdLogout, MdOutlineClose, MdOutlineCheck } from 'react-icons/md'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'

import * as blockies from 'blockies-ts';
import { DropDown, Button } from 'components/common';
import { useToasts } from 'hooks/toasts';
import { useLocalStorage, useDragAndDrop } from 'hooks'
import { ToolTip } from 'components/common'

const Accounts = ({ accounts, selectedAddress, onSelectAcc, onRemoveAccount, hidePrivateValue }) => {
    const { addToast } = useToasts()
    const [logoutWarning, setLogoutWarning] = useState(false)
    const [closed, setClosed] = useState(false)

    const [userSortedItems, setSortedItems] = useLocalStorage({
        key: 'userSortedItems',
        defaultValue: {}
    })

    const onDropEnd = (list) => {
        if (chosenSort !== 'custom') setChosenSort('custom')
        
        setSortedItems(
            prev => ({
                ...prev,
                accounts: list
            })
        )
    }
    
    const { chosenSort,
        setChosenSort,
        dragStart,
        dragEnter,
        dragTarget,
        target,
        handle,
        drop
    } = useDragAndDrop(userSortedItems.accounts?.length ? 'custom' : 'default', 'id', onDropEnd)

    const sortedAccounts = [...accounts].sort((a, b) => {
        if (chosenSort === 'custom' && userSortedItems.accounts?.length) {
            const sorted = userSortedItems.accounts.indexOf(a.id) - userSortedItems.accounts.indexOf(b.id)
            return sorted
        } else {
            const sorted = accounts.indexOf(a.id) - accounts.indexOf(b.id)
            return sorted
        }
    })

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
            <div className="sort-buttons">
                <ToolTip label='Sorted accounts by drag and drop'>
                    <MdDragIndicator color={chosenSort === "custom" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('custom')} />
                </ToolTip>
                <ToolTip label='Sorted accounts by default'>
                    <MdOutlineSort color={chosenSort === "default" ? "#80ffdb" : ""} cursor="pointer" onClick={() => setChosenSort('default')} />
                </ToolTip>
            </div>
            {
              sortedAccounts.map(({ id, email, signer, signerExtra }, i) => 
                logoutWarning !== id ?
                    <div
                        className={`account ${isActive(id)}`}
                        key={id}
                        draggable={sortedAccounts.length > 1}
                        onDragStart={(e) => {                
                            if (handle.current === target.current) dragStart(e, i)
                            else e.preventDefault();
                         }}
                        onMouseDown={(e) => dragTarget(e, i)}
                        onDragEnter={(e) => dragEnter(e, i)}
                        onDragEnd={(e) => drop(sortedAccounts)}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="inner" onClick={() => onSelectAccount(id)}>
                            {sortedAccounts.length > 1 && <div className='drag-handle'>
                                <MdDragIndicator id={`${i}-handle`} />
                            </div>}
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