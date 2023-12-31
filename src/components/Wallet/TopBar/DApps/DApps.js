import React, { useState, useCallback } from 'react'
import { useHistory } from 'react-router-dom'

import { checkClipboardPermission } from 'lib/permissions'
import { canOpenInIframe } from 'lib/dappsUtils'

import { DropDown, Button, Loading, Icon } from 'components/common'
import DropDownItem from 'components/common/DropDown/DropDownItem/DropDownItem'
import DropDownItemSeparator from 'components/common/DropDown/DropDownItem/DropDownItemSeparator'

import { MdBrokenImage } from 'react-icons/md'
import { FiHelpCircle } from 'react-icons/fi'
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
    let uri = ''

    if (isClipboardGranted) {
      uri = await navigator.clipboard.readText()
    } else {
      uri = prompt('Enter WalletConnect URI')
    }
    connect(
      { uri },
      {
        isClipboardGranted
      }
    )
  }, [connect, isClipboardGranted])

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
            loading={isWcConnecting}
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
            Automatic connection enabled, just copy a WalletConnect URL and click this button.
          </label>
        ) : null}
      </div>
      <div className={styles.dappList}>
        {connections.map(({ topic, peer }) => (
          <DropDownItem className={styles.dappsItem} key={topic}>
            <div className={styles.icon}>
              <div
                className={styles.iconOverlay}
                style={{
                  backgroundImage: `url(${
                    peer.metadata.icons.filter((x) => !x.endsWith('favicon.ico'))[0]
                  })`
                }}
              />
              <MdBrokenImage />
            </div>
            <span onClick={() => onConnectionClick(peer.metadata.url)}>
              <div className={styles.details}>
                <div className={styles.name}>{peer.metadata.name || 'Untitled dApp'}</div>
              </div>
            </span>
            <DropDownItemSeparator />
            <button
              type="button"
              onClick={() => {
                disconnect(topic)
              }}
            >
              Disconnect
            </button>
          </DropDownItem>
        ))}
      </div>
    </DropDown>
  )
}

export default React.memo(DApps)
