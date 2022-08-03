import "./TopBar.scss";

import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu, MdRemoveRedEye, MdVisibilityOff } from "react-icons/md";
import Accounts from "./Accounts/Accounts";
import Networks from "./Networks/Networks";
import { networkIconsById } from "consts/networks";
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
  addRequest,
  userSorting,
  setUserSorting
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const account = accounts.find(({ id }) => id === selectedAcc)
  const accountIcon = blockies.create({ seed: account ? account.id : null }).toDataURL()
 
  const visualEnv =
    (process.env.REACT_APP_VISUAL_ENV === 'dev')
      ? 'dev' : (
        new URL(document.URL).pathname.startsWith('/staging/')
      ) ? 'staging' : null

    return (
    <div id="topbar" className={ visualEnv ? ('visual-env visual-env-' + visualEnv ) : ''}>
      {
        visualEnv &&
          <div className='env-bar' >
            {visualEnv === 'dev' && <>Development mode</>}
            {visualEnv === 'staging' && <>Staging mode</>}
          </div>
      }
      <div id="mobile-menu" onClick={() => setMenuOpen(!isMenuOpen)}>
        <div className="icon" style={{backgroundImage: `url(${accountIcon})`}}></div>
        <MdOutlineArrowForward/>
        <div className="icon" style={{backgroundImage: `url(${networkIconsById[network.id]})`}}></div>
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
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount} hidePrivateValue={hidePrivateValue}  userSorting={userSorting} setUserSorting={setUserSorting}/>        
        <Networks setNetwork={setNetwork} network={network} allNetworks={allNetworks}  userSorting={userSorting}
        setUserSorting={setUserSorting}/>
        <Links/>
      </div>
    </div>
  );
};

export default TopBar;
