import "./TopBar.css";

import React, { useState, useEffect } from "react";
import { FiHelpCircle } from "react-icons/fi";
import DropDown from "../common/DropDown/DropDown";

const TopBar = ({
    match,
  connections,
  connect,
  disconnect,
  onSelectAcc,
  selectedAcc,
  accounts,
  network,
  setNetwork,
  allNetworks,
}) => {
  const [isClipboardGranted, setClipboardGranted] = useState(false);

  const checkPermissions = async () => {
    const response = await navigator.permissions.query({
      name: "clipboard-read",
      allowWithoutGesture: false,
    });
    const status = response.state === 'granted' || response.state === 'prompt' ? true : false;
    
    setClipboardGranted(status);
    return status;
  };

  const readClipboard = async () => {
    if (await checkPermissions()) {
      const content = await navigator.clipboard.readText();
      connect({ uri: content });
    }
  };

  useEffect(() => checkPermissions(), []);

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
                  src={session.peerMeta.icons[0]}
                  alt={session.peerMeta.name}
                ></img>
              </div>
              <div className="name">{session.peerMeta.name}</div>
              <div className="separator"></div>
              <button onClick={() => disconnect(uri)}>Disconnect</button>
            </div>
          ))}
        </DropDown>

        <select
          id="accountSelector"
          onChange={(ev) => onSelectAcc(ev.target.value)}
          defaultValue={selectedAcc}
        >
          {accounts.map((acc) => (
            <option key={acc.id}>{acc.id}</option>
          ))}
        </select>

        <select
          id="networkSelector"
          onChange={(ev) => setNetwork(ev.target.value)}
          defaultValue={network.name}
        >
          {allNetworks.map((network) => (
            <option key={network.id}>{network.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TopBar;
