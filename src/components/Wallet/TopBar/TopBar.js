
import React, { useState, useMemo } from "react";
import cn from 'classnames'
import { NavLink, useRouteMatch } from "react-router-dom";
import { MdOutlineArrowForward, MdMenu, MdExitToApp, MdInfo } from "react-icons/md";
import { ReactComponent as PrivacyOff } from './images/privacy-off.svg'
import { ReactComponent as PrivacyOn } from './images/privacy-on.svg'
import Accounts from "./Accounts/Accounts";
import Networks from "./Networks/Networks";
import { networkIconsById } from "consts/networks";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import Links from "./Links/Links";
import WalletTokenButton from "./WalletTokenButton/WalletTokenButton";
import { Button, ToolTip } from 'components/common';
import DAPPS_ICON from 'resources/dapps.svg';

import { ReactComponent as MenuIcon } from 'resources/icons/burger-menu.svg'
import { ReactComponent as CloseIcon } from 'resources/icons/close.svg' 

import styles from "./TopBar.module.scss";

const TopBar = ({
  useRelayerData,
  relayerURL,
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

    return (<>
    <div className={cn(styles.mobileBackground, {[styles.visible]: isMenuOpen})}></div>
    <div className={`${styles.wrapper} ${( visualEnv ? (`${styles.visualEnv} ${styles['visualEnv' + visualEnv]}`) : styles.wrapper) + (dappModeTopBar ? ` ${styles.dappMode}` : '')}`}>
      {
        visualEnv &&
          <div className={styles.envBar} >
            {visualEnv === 'dev' && <>Development mode</>}
            {visualEnv === 'staging' && <>Staging mode</>}
          </div>
      }

      {dappModeTopBar ?
        <div className={styles.dappMenu}>
          <div className={styles.dappMenuBtns}>
            <ToolTip label='Open Ambire Wallet menu'>
              <Button className={`${styles.buttonComponent} ${styles.ambireMenuBtn}`} border mini icon={<MdMenu size={23} />}
                onClick={() => toggleSideBarOpen()}
              ></Button>
            </ToolTip>
            <div className={styles.dappData}>
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
                  <img className={styles.dappLogo} src={currentDappData?.iconUrl || DAPPS_ICON} alt={currentDappData?.name}/>
                </a>
              </ToolTip>
              <ToolTip label={`Exit from ${currentDappData?.name}`}>
                <Button
                  className={`${styles.buttonComponent} ${styles.dappExitBtn}`}
                  secondary mini 
                  icon={<MdExitToApp size={15} /> }
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

      <div className={styles.mobileMenu}>
        {!dappModeTopBar &&  <NavLink to={'/wallet/dashboard'}>
          <img src='/resources/logo.svg' className={styles.logo} alt='ambire-logo' />
        </NavLink> }
        <div className={styles.mobileMenuRight} onClick={() => setMenuOpen(prev => !prev)}>
          <img className={styles.icon} src={accountIcon} alt="account-icon" />
          <MdOutlineArrowForward/>
          <img className={styles.icon} src={networkIconsById[network.id]} alt="network-icon" />
          <div className={styles.menuButton}>
            { isMenuOpen ? <CloseIcon /> : 
              <div className={styles.menuIcon}>
                <MenuIcon/>
              </div>
            }
          </div>
        </div>
      </div>

      <div className={`${styles.container} ${isMenuOpen ? styles.open : ''}`}>
        <div className={styles.privacyAndRewards}>
          {isPrivateMode ? <PrivacyOff cursor="pointer" size={28} onClick={togglePrivateMode} /> : <PrivacyOn cursor="pointer" size={28} onClick={togglePrivateMode} />}
          {selectedAcc && <WalletTokenButton
            useRelayerData={useRelayerData}
            relayerURL={relayerURL}
            rewardsData={rewardsData}
            account={account}
            network={network}
            hidePrivateValue={hidePrivateValue}
            addRequest={addRequest}
          />}
        </div>
        <DApps connections={connections} connect={connect} disconnect={disconnect} isWcConnecting={isWcConnecting} />
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount} hidePrivateValue={hidePrivateValue} userSorting={userSorting} setUserSorting={setUserSorting} />
        <Networks setNetwork={setNetwork} network={network} allNetworks={allNetworks} userSorting={userSorting}
          setUserSorting={setUserSorting} dappsCatalog={dappsCatalog} dapModeTopBar={dappModeTopBar} />
        <Links />
      </div>
    </div>
  </>);
};

export default TopBar;
