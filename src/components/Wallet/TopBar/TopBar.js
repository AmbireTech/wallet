import React, { useState, useMemo } from 'react'
import * as blockies from 'blockies-ts'
import cn from 'classnames'
import { NavLink, useRouteMatch } from 'react-router-dom'

import { networkIconsById } from 'consts/networks'

import { MdOutlineArrowForward } from 'react-icons/md'
import { ReactComponent as MenuIcon } from 'resources/icons/burger-menu.svg'
import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import Accounts from './Accounts/Accounts'
import Networks from './Networks/Networks'
import DApps from './DApps/DApps'
import Links from './Links/Links'
import WalletTokenButton from './WalletTokenButton/WalletTokenButton'

import { ReactComponent as PrivacyOff } from './images/privacy-off.svg'
import { ReactComponent as PrivacyOn } from './images/privacy-on.svg'

import styles from './TopBar.module.scss'
import DAppMenu from './DAppMenu/DAppMenu'

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

  const dappModeTopBar = useMemo(
    () => isDappMode && routeMatch && currentDappData,
    [currentDappData, isDappMode, routeMatch]
  )

  const account = useMemo(
    () => accounts.find(({ id }) => id === selectedAcc),
    [accounts, selectedAcc]
  )
  const accountIcon = useMemo(
    () => blockies.create({ seed: account ? account.id : null }).toDataURL(),
    [account]
  )

  const visualEnv =
    process.env.REACT_APP_VISUAL_ENV === 'dev'
      ? 'dev'
      : new URL(document.URL).pathname.startsWith('/staging/')
      ? 'staging'
      : null

  return (
    <>
      <div
        className={cn(styles.mobileBackground, { [styles.visible]: isMenuOpen })}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`${styles.wrapper} ${
          (visualEnv ? `${styles.visualEnv} ${styles[`visualEnv${visualEnv}`]}` : styles.wrapper) +
          (dappModeTopBar ? ` ${styles.dappMode}` : '')
        }`}
      >
        {visualEnv && (
          <div className={styles.envBar}>
            {visualEnv === 'dev' && <>Development mode</>}
            {visualEnv === 'staging' && <>Staging mode</>}
          </div>
        )}

        {dappModeTopBar ? (
          <DAppMenu
            toggleSideBarOpen={toggleSideBarOpen}
            currentDappData={currentDappData}
            loadCurrentDappData={loadCurrentDappData}
            dappModeTopBar={dappModeTopBar}
          />
        ) : (
          <NavLink to="/wallet/dashboard">
            <div id="logo" />
            <div id="icon" />
          </NavLink>
        )}

        <div className={styles.mobileMenu}>
          {!dappModeTopBar && (
            <NavLink to="/wallet/dashboard">
              <img src="/resources/logo.svg" className={styles.logo} alt="ambire-logo" />
            </NavLink>
          )}
          <div className={styles.mobileMenuRight} onClick={() => setMenuOpen((prev) => !prev)}>
            <img className={styles.icon} src={accountIcon} alt="account-icon" />
            <MdOutlineArrowForward />
            <img className={styles.icon} src={networkIconsById[network.id]} alt="network-icon" />
            <div className={styles.menuButton}>
              {isMenuOpen ? (
                <CloseIcon />
              ) : (
                <div className={styles.menuIcon}>
                  <MenuIcon />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${styles.container} ${isMenuOpen ? styles.open : ''}`}>
          <div className={styles.privacyAndRewards}>
            {isPrivateMode ? (
              <PrivacyOff cursor="pointer" size={28} onClick={togglePrivateMode} />
            ) : (
              <PrivacyOn cursor="pointer" size={28} onClick={togglePrivateMode} />
            )}
            {selectedAcc && (
              <WalletTokenButton
                useRelayerData={useRelayerData}
                relayerURL={relayerURL}
                rewardsData={rewardsData}
                accountId={selectedAcc}
                network={network}
                hidePrivateValue={hidePrivateValue}
                addRequest={addRequest}
              />
            )}
          </div>
          <DApps
            connections={connections}
            connect={connect}
            disconnect={disconnect}
            isWcConnecting={isWcConnecting}
          />
          <Accounts
            accounts={accounts}
            selectedAddress={selectedAcc}
            onSelectAcc={onSelectAcc}
            onRemoveAccount={onRemoveAccount}
            hidePrivateValue={hidePrivateValue}
            userSorting={userSorting}
            setUserSorting={setUserSorting}
          />
          <Networks
            setNetwork={setNetwork}
            network={network}
            allNetworks={allNetworks}
            userSorting={userSorting}
            setUserSorting={setUserSorting}
            dappsCatalog={dappsCatalog}
            dapModeTopBar={dappModeTopBar}
          />
          <Links
            inviteCode={rewardsData?.rewards?.extensionKey?.key}
            extensionInviteCodeUsed={rewardsData?.rewards?.extensionKey?.used}
          />
        </div>
      </div>
    </>
  )
}

export default TopBar
