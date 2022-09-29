import styles from './DApps.module.scss'

import React, { useState, useCallback } from 'react'
import { FiHelpCircle } from 'react-icons/fi'
import { ReactComponent as ConnectIcon } from './images/connect.svg'
import { MdBrokenImage } from 'react-icons/md'
import { AiOutlineDisconnect } from 'react-icons/ai'
import { ReactComponent as WalletConnect } from './images/wallet-connect.svg'
import { DropDown, ToolTip, Button } from "components/common"
import { checkClipboardPermission } from 'lib/permissions'
import { MdOutlineWarning } from 'react-icons/md'
import { canOpenInIframe } from 'lib/dappsUtils'
import { useHistory } from 'react-router-dom'
import DropDownItem from 'components/common/DropDown/DropDownItem/DropDownItem'
import DropDownItemSeparator from 'components/common/DropDown/DropDownItem/DropDownItemSeparator'

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

    const wcTitle = <WalletConnect />

    const onConnectionClick = useCallback( async (url) => {
        const canOpen = await canOpenInIframe(url)
        if(canOpen) {
            history.push(`/wallet/dapps?dappUrl=${encodeURIComponent(url + `?${Date.now()}`)}`)
        } else {
            window.open(url, '_blank')
        }
    }, [history])

    return (
        <DropDown className={styles.wrapper} menuClassName={styles.menu} title={wcTitle} badge={connections.length} onOpen={() => checkPermission()} isLoading={isClipboardGranted && isWcConnecting}>
            <div className={styles.connectDapp}>
                <div className={styles.heading}>
                    <Button primaryGradient small className={styles.buttonClass} icon={<ConnectIcon />} disabled={isClipboardGranted} onClick={readClipboard}>
                        Connect dApp
                    </Button>
                    <a href='https://help.ambire.com/hc/en-us/articles/4410889965842' target='_blank' rel='noreferrer'>
                        <FiHelpCircle size={21} />
                    </a>
                </div>
                {isClipboardGranted ? (
                    <label>
                        Automatic connection enabled, just copy a WalletConnect URL and
                        come back to this tab.
                    </label>
                ) : null}
            </div>
            <div className={styles.dappList}>
                {connections.map(({ session, uri, isOffline }) => (
                  <DropDownItem className={styles.dappsItem} key={session.key}>
                      <div className={styles.icon}>
                          <div className={styles.iconOverlay} style={{backgroundImage: `url(${session.peerMeta.icons.filter(x => !x.endsWith('favicon.ico'))[0]})`}}/>
                          <MdBrokenImage/>
                      </div>
                      <span onClick={() => onConnectionClick(session.peerMeta.url)}>
                          <div className={styles.details}>
                              {
                                  isLegacyWC(session) ?
                                    <ToolTip className={styles.sessionWarning} label="dApp uses legacy WalletConnect bridge which is unreliable and often doesn't work. Please tell the dApp to update to the latest WalletConnect version.">
                                        <MdOutlineWarning/>
                                    </ToolTip>
                                    :
                                    null
                              }
                              {
                                  isOffline ?
                                    <ToolTip className={styles.sessionError} label="WalletConnect connection may be offline. Check again later. If this warning persist try to disconnect and connect WalletConnect.">
                                        <AiOutlineDisconnect />
                                    </ToolTip>
                                    :
                                    null
                              }
                              <div className={styles.name}>{session.peerMeta.name}</div>
                          </div>
                      </span>
                      <DropDownItemSeparator />
                      <button onClick={() => disconnect(uri)}>Disconnect</button>
                  </DropDownItem>
                ))}
            </div>
        </DropDown>
    )
}

export default DApps
