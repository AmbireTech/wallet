import "./TopBar.scss";

import React, { useState } from "react";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu } from "react-icons/md";
import { Button, Select } from "../../common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import { useModals } from "../../../hooks";
import { WalletTokenModal } from "../../Modals";

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
  rewards
}) => {
  const { showModal } = useModals()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const { total } = rewards
  
  const networksItems = allNetworks.map(({ id, name, icon }) => ({
    label: name,
    value: id,
    icon
  }))

  const account = accounts.find(({ id }) => id === selectedAcc)

  const showWalletTokenModal = () => showModal(<WalletTokenModal rewards={rewards}/>)

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
        <Button small border onClick={showWalletTokenModal}>{ total.toFixed(2) } WALLET</Button>
        <DApps connections={connections} connect={connect} disconnect={disconnect}/>
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount}/>
        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
      </div>
    </div>
  );
};

export default TopBar;
