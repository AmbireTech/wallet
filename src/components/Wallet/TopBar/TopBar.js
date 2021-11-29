import "./TopBar.scss";

import React, { useState } from "react";
import { MdOutlineClose, MdOutlineMenu } from "react-icons/md";
import { Select } from "../../common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";

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

  return (
    <div id="topbar">
      <div id="mobile-menu-button" onClick={() => setMenuOpen(!isMenuOpen)}>
        { isMenuOpen ? <MdOutlineClose/> : <MdOutlineMenu/> }
      </div>
      <div className={`container ${isMenuOpen ? 'open' : ''}`}>
        <DApps connections={connections} connect={connect} disconnect={disconnect}/>
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount}/>
        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
      </div>
    </div>
  );
};

export default TopBar;
