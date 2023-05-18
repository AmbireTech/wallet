import React, { useState, useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { checkClipboardPermission } from 'lib/permissions'
import { canOpenInIframe } from 'lib/dappsUtils'

import { DropDown, ToolTip, Button, Loading, Icon } from 'components/common'
import DropDownItem from 'components/common/DropDown/DropDownItem/DropDownItem'
import DropDownItemSeparator from 'components/common/DropDown/DropDownItem/DropDownItemSeparator'

import { MdOutlineWarning, MdBrokenImage } from 'react-icons/md'
import { FiHelpCircle } from 'react-icons/fi'
import { AiOutlineDisconnect } from 'react-icons/ai'
import { ReactComponent as WalletConnect } from 'resources/icons/wallet-connect.svg'
import { ReactComponent as ConnectIcon } from './images/connect.svg'

import styles from './DApps.module.scss'

const DApps = ({ connections, connect, disconnect, isWcConnecting }) => {
  const history = useHistory()
  const [isClipboardGranted, setClipboardGranted] = useState(false)

  const checkPermission = async () => {
    const status = await checkClipboardPermission()
    setClipboardGranted(status)
    return status
  }

  const readClipboard = useCallback(async () => {
    if (isClipboardGranted) {
      const content = await navigator.clipboard.readText()
      if (content.startsWith('wc:')) connect({ uri: content })
    } else {
      const uri = prompt('Enter WalletConnect URI')
      if (uri) connect({ uri })
    }
  }, [connect, isClipboardGranted])

  const isLegacyWC = ({ bridge }) => /https:\/\/bridge.walletconnect.org/g.test(bridge)

  const onConnectionClick = useCallback(
    async (url) => {
      const canOpen = await canOpenInIframe(url)
      if (canOpen) {
        history.push(`/wallet/dapps?dappUrlCatalog=${encodeURIComponent(`${url}?${Date.now()}`)}`)
      } else {
        window.open(url, '_blank')
      }
    },
    [history]
  )

  return (
    <DropDown
      className={styles.wrapper}
      menuClassName={styles.menu}
      title={
        <div className={styles.title}>
          <Icon size="sm" noBackground className={styles.wcIcon}>
            <WalletConnect />
          </Icon>
          <label>WalletConnect</label>
        </div>
      }
      badge={connections.length}
      onOpen={() => checkPermission()}
      isLoading={isClipboardGranted && isWcConnecting}
      testId="dapp-dropdown"
    >
      <div className={styles.connectDapp}>
        <div className={styles.heading}>
          <Button
            variant="primaryGradient"
            size="sm"
            className={styles.buttonClass}
            icon={isWcConnecting ? <Loading size={16} /> : <ConnectIcon />}
            disabled={isClipboardGranted || isWcConnecting}
            onClick={readClipboard}
            testId="connect-btn"
          >
            Connect dApp
          </Button>
          <a
            href="https://help.ambire.com/hc/en-us/articles/4410889965842"
            target="_blank"
            rel="noreferrer"
          >
            <FiHelpCircle className={styles.helpIcon} />
          </a>
        </div>
        {isClipboardGranted ? (
          <label>
            Automatic connection enabled, just copy a WalletConnect URL and come back to this tab.
          </label>
        ) : null}
      </div>
      <div className={styles.dappList}>
        {connections.map(({ session, connectionId, isOffline, wcVersion }, index) => (
          <DropDownItem className={styles.dappsItem} key={index}>
            <div className={styles.icon}>
              <div
                className={styles.iconOverlay}
                style={{
                  backgroundImage: `url(${
                    session.peerMeta.icons.filter((x) => !x.endsWith('favicon.ico'))[0]
                  })`
                }}
              />
              <MdBrokenImage />
            </div>
            <span onClick={() => onConnectionClick(session.peerMeta.url)}>
              <div className={styles.details}>
                {isLegacyWC(session) ? (
                  <ToolTip
                    className={styles.sessionWarning}
                    label="dApp uses legacy WalletConnect bridge which is unreliable and often doesn't work. Please tell the dApp to update to the latest WalletConnect version."
                  >
                    <MdOutlineWarning />
                  </ToolTip>
                ) : null}
                {isOffline ? (
                  <ToolTip
                    className={styles.sessionError}
                    label="WalletConnect connection may be offline. Check again later. If this warning persist try to disconnect and connect WalletConnect."
                  >
                    <AiOutlineDisconnect />
                  </ToolTip>
                ) : null}
                <div className={styles.name}>{session.peerMeta.name || 'Untitled dApp'}</div>
              </div>
            </span>
            <DropDownItemSeparator />
            <button type="button" onClick={() => disconnect(connectionId, wcVersion)}>
              Disconnect
            </button>
          </DropDownItem>
        ))}
      </div>
    </DropDown>
  )
}

export default React.memo(DApps)
