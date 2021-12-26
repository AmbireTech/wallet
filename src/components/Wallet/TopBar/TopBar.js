import "./TopBar.scss";

import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { MdOutlineArrowForward, MdOutlineClose, MdOutlineMenu } from "react-icons/md";
import { Button, Select, ToolTip } from "../../common";
import Accounts from "./Accounts/Accounts";
import DApps from "./DApps/DApps";
import * as blockies from 'blockies-ts';
import Links from "./Links/Links";
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
  rewardsData
}) => {
  const { showModal } = useModals()
  const [isMenuOpen, setMenuOpen] = useState(false)
  const [rewards, setRewards] = useState({})
  const [rewardsTotal, setRewardsTotal] = useState(0)
  const { isLoading, data, errMsg } = rewardsData
  
  const networksItems = allNetworks.map(({ id, name, icon }) => ({
    label: name,
    value: id,
    icon
  }))

  const account = accounts.find(({ id }) => id === selectedAcc)
  const accountIcon = blockies.create({ seed: account ? account.id : null }).toDataURL()

  const showWalletTokenModal = () => showModal(<WalletTokenModal rewards={rewards}/>)

  useEffect(() => {
      if (errMsg || !data || !data.success) return

      const { rewards, multipliers } = data
      if (!rewards.length) return

      const rewardsDetails = Object.fromEntries(rewards.map(({ _id, rewards }) => [_id, rewards[account.id] || 0]))
      const rewardsTotal = Object.values(rewardsDetails).reduce((acc, curr) => acc + curr, 0)
      rewardsDetails.multipliers = multipliers

      setRewardsTotal(rewardsTotal)
      setRewards(rewardsDetails)
  }, [data, errMsg, account])

  return (
    <div id="topbar">
      <div id="mobile-menu" onClick={() => setMenuOpen(!isMenuOpen)}>
        <div className="icon" style={{backgroundImage: `url(${accountIcon})`}}></div>
        <MdOutlineArrowForward/>
        <div className="icon" style={{backgroundImage: `url(${network.icon})`}}></div>
        <div id="menu-button">
          { isMenuOpen ? <MdOutlineClose/> : <MdOutlineMenu/> }
        </div>
      </div>

      <NavLink to={'/wallet/dashboard'}>
        <div id="logo" />
        <div id="icon" />
      </NavLink>
      <div className={`container ${isMenuOpen ? 'open' : ''}`}>
        {
          !isLoading && (errMsg || !data) ?
            <ToolTip label="WALLET rewards are not available without a connection to the relayer">
              <Button small border disabled onClick={showWalletTokenModal}>Unavailable</Button>
            </ToolTip>
            :
            <Button small border disabled={isLoading} onClick={showWalletTokenModal}>{ rewardsTotal.toFixed(3) } WALLET</Button>
        }
        <DApps connections={connections} connect={connect} disconnect={disconnect}/>
        <Accounts accounts={accounts} selectedAddress={selectedAcc} onSelectAcc={onSelectAcc} onRemoveAccount={onRemoveAccount}/>
        <Select defaultValue={network.id} items={networksItems} onChange={value => setNetwork(value)}/>
        <Links/>
      </div>
    </div>
  );
};

export default TopBar;
