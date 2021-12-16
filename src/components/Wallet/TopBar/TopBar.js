import "./TopBar.scss";

import React, { useState } from "react";
import { MdChatBubbleOutline, MdMenuBook, MdOutlineArrowForward, MdOutlineClose, MdOutlineHelpOutline, MdOutlineMenu, MdOutlineLightbulb } from "react-icons/md";
import { BsDiscord, BsTelegram, BsTwitter } from "react-icons/bs";
import { DropDown, Select } from "../../common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';

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
        <DropDown id="help-dropdown" title={<MdOutlineHelpOutline/>}>
          <a className="item" href="https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet" target="_blank" rel="noreferrer">
            <MdMenuBook/> Help Center
          </a>
          <a className="item" href="https://help.ambire.com/hc/en-us/requests/new" target="_blank" rel="noreferrer">
            <MdChatBubbleOutline/> Report an issue
          </a>
          <a className="item" href="https://discord.gg/nMBGJsb" target="_blank" rel="noreferrer">
            <BsDiscord/> Discord
          </a>
          <a className="item" href="https://twitter.com/AmbireWallet" target="_blank" rel="noreferrer">
            <BsTwitter/> Twitter
          </a>
          <a className="item" href="https://t.me/AdExNetworkOfficial" target="_blank" rel="noreferrer">
            <BsTelegram/> Telegram
          </a>
          <a className="item" href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf" target="_blank" rel="noreferrer">
            <MdOutlineLightbulb/> ToS
          </a>
        </DropDown>
      </div>
    </div>
  );
};

export default TopBar;
