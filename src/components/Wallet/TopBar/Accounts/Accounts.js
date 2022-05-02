import './Accounts.scss'

import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AiOutlinePlus } from 'react-icons/ai'
import { MdOutlineContentCopy, MdLogout, MdOutlineClose, MdOutlineCheck } from 'react-icons/md'
import { MdDragIndicator, MdOutlineSort } from 'react-icons/md'

import * as blockies from 'blockies-ts';
import { DropDown, Button } from 'components/common';
import { useToasts } from 'hooks/toasts';
import { useDragAndDrop, useCheckMobileScreen } from 'hooks'
import { ToolTip } from 'components/common'

const Accounts = ({ accounts, selectedAddress, onSelectAcc, onRemoveAccount, hidePrivateValue, userSorting, setUserSorting }) => {
    const { addToast } = useToasts()
    const [logoutWarning, setLogoutWarning] = useState(false)
    const [closed, setClosed] = useState(false)

    const isMobileScreen = useCheckMobileScreen()

    const sortType = userSorting.accounts?.sortType || 'default'

    const onDropEnd = (list) => {        
        setUserSorting(
            prev => ({
                ...prev,
                accounts: {
                    sortType: 'custom',
                    items: list
                }
            })
        )
    }
    
    const {
        dragStart,
        dragEnter,
        dragTarget,
        target,
        handle,
        drop
    } = useDragAndDrop('id', onDropEnd)

    const sortedAccounts = [...accounts].sort((a, b) => {
        if (sortType === 'custom' && userSorting.accounts?.items?.length) {
            const sorted = userSorting.accounts.items.indexOf(a.id) - userSorting.accounts.items.indexOf(b.id)
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
            {!isMobileScreen && <div className="sort-buttons">
                <ToolTip label='Sorted accounts by drag and drop'>
                    <MdDragIndicator color={sortType === "custom" ? "#80ffdb" : ""} cursor="pointer"
                    onClick={() => setUserSorting(prev => ({
                        ...prev,
                        accounts: {
                            ...prev.accounts,
                            sortType: 'custom'
                        }
                    }))} />
                </ToolTip>
                <ToolTip label='Sorted accounts by default'>
                    <MdOutlineSort color={sortType === "default" ? "#80ffdb" : ""} cursor="pointer"
                    onClick={() => setUserSorting(prev => ({
                        ...prev,
                        accounts: {
                            ...prev.accounts,
                            sortType: 'default'
                        }
                    }))} />
                </ToolTip>
            </div>}
            {
              sortedAccounts.map(({ id, email, signer, signerExtra }, i) => 
                logoutWarning !== id ?
                    <div
                        className={`account ${isActive(id)}`}
                        key={id}
                        draggable={sortedAccounts.length > 1 && sortType === 'custom' && !isMobileScreen}
                        onDragStart={(e) => {                
                            if (handle.current === target.current || handle.current.contains(target.current)) dragStart(e, i)
                            else e.preventDefault();
                         }}
                        onMouseDown={(e) => dragTarget(e, i)}
                        onDragEnter={(e) => dragEnter(e, i)}
                        onDragEnd={(e) => drop(sortedAccounts)}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <div className="inner" onClick={() => onSelectAccount(id)}>
                            {sortedAccounts.length > 1 && sortType === 'custom' && !isMobileScreen && <MdDragIndicator className='drag-handle' id={`${i}-handle`} />}
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