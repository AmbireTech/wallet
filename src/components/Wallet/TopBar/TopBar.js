import "./TopBar.scss";

import React, { useState, useEffect, useCallback } from "react";
import { FiHelpCircle } from "react-icons/fi";
import { DropDown, Select } from "../../common";
import Accounts from "./Accounts/Accounts";
import { checkClipboardPermission } from "../../../helpers/permissions";

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
  const [isClipboardGranted, setClipboardGranted] = useState(false);

  const checkPermission = async () => {
    const status = await checkClipboardPermission()
    setClipboardGranted(status)
    return status
  }

  const readClipboard = useCallback(async () => {
    if (isClipboardGranted) {
      const content = await navigator.clipboard.readText();
      if (content.startsWith('wc:')) connect({ uri: content });
    } else {
      const uri = prompt("Enter WalletConnect URI");
      if (uri) connect({ uri });
    }
  }, [connect, isClipboardGranted]);

  const networksItems = allNetworks.map(({ id, name, icon }) => ({
    label: name,
    value: id,
    icon
  }))

  useEffect(() => checkPermission(), []);

  return (
    <div id="topbar">
      <div className="container">
        <DropDown title="dApps" badge={connections.length}>
          <div id="connect-dapp">
            <div className="heading">
              <button disabled={isClipboardGranted} onClick={readClipboard}>
                Connect dApp
              </button>
              <FiHelpCircle size={30} />
            </div>
            {isClipboardGranted ? (
              <label>
                Automatic connection enabled, just copy a WalletConnect URL and
                come back to this tab.
              </label>
            ) : null}
          </div>
          {connections.map(({ session, uri }) => (
            <div className="item dapps-item" key={session.peerId}>
              <div className="icon">
                <img
                  src={session.peerMeta.icons.filter(x => !x.endsWith('favicon.ico'))[0]}
                  alt={session.peerMeta.name}
                ></img>
              </div>
              <a href={session.peerMeta.url} target="_blank" rel="noreferrer">
                <div className="name">{session.peerMeta.name}</div>
              </a>
              <div className="separator"></div>
              <button onClick={() => disconnect(uri)}>Disconnect</button>
            </div>
          ))}
        </DropDown>

        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount}/>

        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
      </div>
    </div>
  );
};

export default TopBar;
