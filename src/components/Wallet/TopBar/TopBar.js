import "./TopBar.scss";

import React, { useState } from "react";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu } from "react-icons/md";
import { Select } from "../../common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import Links from "./Links/Links";

const TopBar = ({
  connections,
  connect,
  disconnect,
  onSelectAcc,
  onRemoveAccount,
  selectedAcc,
  accounts,
  network,
  setNetwork,
  allNetworks,
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  
  const networksItems = allNetworks.map(({ id, name, icon }) => ({
    label: name,
    value: id,
    icon
  }))

  const account = accounts.find(({ id }) => id === selectedAcc)

  return (
    <div id="topbar">
      <div id="mobile-menu" onClick={() => setMenuOpen(!isMenuOpen)}>
        <div className="icon" style={{backgroundImage: `url(${blockies.create({ seed: account.id }).toDataURL()})`}}></div>
        <MdOutlineArrowForward/>
        <div className="icon" style={{backgroundImage: `url(${network.icon})`}}></div>
        <div id="menu-button">
          { isMenuOpen ? <MdOutlineClose/> : <MdOutlineMenu/> }
        </div>
      </div>

      <div className={`container ${isMenuOpen ? 'open' : ''}`}>
        <DApps connections={connections} connect={connect} disconnect={disconnect}/>
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount}/>
        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
        <Links/>
      </div>
    </div>
  );
};

export default TopBar;
