import "./TopBar.scss";

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu, MdRemoveRedEye, MdVisibilityOff } from "react-icons/md";
import { Select } from "components/common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import Links from "./Links/Links";
import WalletTokenButton from "./WalletTokenButton/WalletTokenButton";

const TopBar = ({
  connections,
  connect,
  disconnect,
  isWcConnecting,
  onSelectAcc,
  onRemoveAccount,
  selectedAcc,
  accounts,
  network,
  setNetwork,
  allNetworks,
  rewardsData,
  privateMode: { isPrivateMode, togglePrivateMode, hidePrivateValue },
  addRequest
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)

  const networksItems = allNetworks.map(({ id, name, icon }) => ({
    label: name,
    value: id,
    icon
  }))

  const account = accounts.find(({ id }) => id === selectedAcc)
  const accountIcon = blockies.create({ seed: account ? account.id : null }).toDataURL()

  return (
    <div id="topbar">
      <div id="mobile-menu" onClick={() => setMenuOpen(!isMenuOpen)}>
        <div className="icon" style={{backgroundImage: `url(${accountIcon})`}}></div>
        <MdOutlineArrowForward/>
        <div className="icon" style={{backgroundImage: `url(${network.icon})`}}></div>
        <div id="menu-button">
          { isMenuOpen ? <MdOutlineClose/> : <MdOutlineMenu/> }
        </div>
      </div>

      <NavLink to={'/wallet/dashboard'}>
        <div id="logo" />
        <div id="icon" />
      </NavLink>
      <div className={`container ${isMenuOpen ? 'open' : ''}`}>
        {selectedAcc && <WalletTokenButton
          rewardsData={rewardsData}
          account={account}
          network={network}
          hidePrivateValue={hidePrivateValue}
          addRequest={addRequest}
        />}
        {isPrivateMode ? <MdVisibilityOff cursor="pointer" size={28} onClick={togglePrivateMode} /> : <MdRemoveRedEye cursor="pointer" size={28} onClick={togglePrivateMode} />}
        <DApps connections={connections} connect={connect} disconnect={disconnect} isWcConnecting={isWcConnecting}/>
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount} hidePrivateValue={hidePrivateValue}/>
        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
        <Links/>
      </div>
    </div>
  );
};

export default TopBar;
