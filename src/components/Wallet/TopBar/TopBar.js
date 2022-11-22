import "./TopBar.scss";

import React, { useState, useMemo } from "react";
import { NavLink, useRouteMatch } from "react-router-dom";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu, MdRemoveRedEye, MdVisibilityOff, MdMenu, MdExitToApp, MdInfo } from "react-icons/md";
import Accounts from "./Accounts/Accounts";
import Networks from "./Networks/Networks";
import { networkIconsById } from "consts/networks";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import Links from "./Links/Links";
import WalletTokenButton from "./WalletTokenButton/WalletTokenButton";
import { Button, ToolTip } from 'components/common';
import DAPPS_ICON from 'resources/dapps.svg';

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
  setUserSorting,
  dappsCatalog
}) => {
  const [isMenuOpen, setMenuOpen] = useState(false)
  const routeMatch = useRouteMatch('/wallet/dapps')

  const { isDappMode, toggleSideBarOpen, currentDappData, loadCurrentDappData } = dappsCatalog

  const dappModeTopBar = useMemo(() => isDappMode && routeMatch && currentDappData, [currentDappData, isDappMode, routeMatch])

  const account = accounts.find(({ id }) => id === selectedAcc)
  const accountIcon = blockies.create({ seed: account ? account.id : null }).toDataURL()

  const visualEnv =
    (process.env.REACT_APP_VISUAL_ENV === 'dev')
      ? 'dev' : (
        new URL(document.URL).pathname.startsWith('/staging/')
      ) ? 'staging' : null

  return (
    <div id="topbar" className={(visualEnv ? ('visual-env visual-env-' + visualEnv) : '') + (dappModeTopBar ? ' dapp-mode' : '')}>
      {
        visualEnv &&
        <div className='env-bar' >
          {visualEnv === 'dev' && <>Development mode</>}
          {visualEnv === 'staging' && <>Staging mode</>}
        </div>
      }
      <div id="mobile-menu" onClick={() => setMenuOpen(!isMenuOpen)}>
        <div className="icon" style={{ backgroundImage: `url(${accountIcon})` }}></div>
        <MdOutlineArrowForward />
        <div className="icon" style={{ backgroundImage: `url(${networkIconsById[network.id]})` }}></div>
        <div id="menu-button">
          {isMenuOpen ? <MdOutlineClose /> : <MdOutlineMenu />}
        </div>
      </div>

      {dappModeTopBar ?
        <div className='dapp-menu'>
          <div className='dapp-menu-btns'>
            <ToolTip label='Open Ambire Wallet menu'>
              <Button className='ambire-menu-btn' border mini icon={<MdMenu size={23} />}
                onClick={() => toggleSideBarOpen()}
              ></Button>
            </ToolTip>
            <div className='dapp-data'>
              <ToolTip label={`Connected with ${currentDappData?.connectionType} -  see/find out more on our blog`}>
                {/* TODO: update the blogpost link */}
                <a className="info-btn" href={'https://blog.ambire.com/connect-to-any-dapp-with-ambire-wallet-and-walletconnect-c1bc096a531e'}
                  target="_blank"
                  rel="noreferrer noopener">
                  <MdInfo size={23} />
                </a>
              </ToolTip>
              <ToolTip label={`Connected to ${currentDappData?.name} with Ambire Wallet`}>
                <a href={currentDappData?.providedBy?.url || currentDappData?.url}
                  target="_blank"
                  rel="noreferrer noopener">
                  <img className='dapp-logo' src={currentDappData?.iconUrl || DAPPS_ICON} alt={currentDappData?.name} />
                </a>
              </ToolTip>
              <ToolTip label={`Exit from ${currentDappData?.name}`}>
                <Button
                  className='dapp-exit-btn'
                  secondary mini
                  icon={<MdExitToApp size={15} />}
                  onClick={() => loadCurrentDappData(null)}
                >Exit</Button>
              </ToolTip>
            </div>
          </div>
        </div>
        :
        <NavLink to={'/wallet/dashboard'}>
          <div id="logo" />
          <div id="icon" />
        </NavLink>
      }

      <div className={`container ${isMenuOpen ? 'open' : ''}`}>
        {selectedAcc && <WalletTokenButton
          rewardsData={rewardsData}
          account={account}
          network={network}
          hidePrivateValue={hidePrivateValue}
          addRequest={addRequest}
        />}
        {isPrivateMode ? <MdVisibilityOff cursor="pointer" size={28} onClick={togglePrivateMode} /> : <MdRemoveRedEye cursor="pointer" size={28} onClick={togglePrivateMode} />}
        <DApps connections={connections} connect={connect} disconnect={disconnect} isWcConnecting={isWcConnecting} />
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount} hidePrivateValue={hidePrivateValue} userSorting={userSorting} setUserSorting={setUserSorting} />
        <Networks setNetwork={setNetwork} network={network} allNetworks={allNetworks} userSorting={userSorting}
          setUserSorting={setUserSorting} dappsCatalog={dappsCatalog} dapModeTopBar={dappModeTopBar} />
        <Links />
      </div>
    </div>
  );
};

export default TopBar;
