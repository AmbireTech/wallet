import './DApps.scss'

import React, { useState, useCallback } from 'react'
import { FiHelpCircle } from 'react-icons/fi'
import { BiTransferAlt } from 'react-icons/bi'
import { MdBrokenImage } from 'react-icons/md'
import { AiOutlineDisconnect } from 'react-icons/ai'
import { DropDown, ToolTip, Button } from "components/common"
import { checkClipboardPermission } from 'lib/permissions'
import { MdOutlineWarning } from 'react-icons/md'

const DApps = ({ connections, connect, disconnect }) => {
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

    return (
        <DropDown id="dApps" title="dApps" badge={connections.length} onOpen={() => checkPermission()}>
            <div id="connect-dapp">
                <div className="heading">
                    <Button small icon={<BiTransferAlt />} disabled={isClipboardGranted} onClick={readClipboard}>
                        Connect dApp
                    </Button>
                    <a href='https://help.ambire.com/hc/en-us/articles/4410889965842' target='_blank' rel='noreferrer'>
                        <FiHelpCircle size={30} />
                    </a>
                </div>
                {isClipboardGranted ? (
                    <label>
                        Automatic connection enabled, just copy a WalletConnect URL and
                        come back to this tab.
                    </label>
                ) : null}
            </div>
            {connections.map(({ session, uri, isOffline }) => (
                <div className="item dapps-item" key={session.key}>
                    <div className="icon">
                        <div className="icon-overlay" style={{backgroundImage: `url(${session.peerMeta.icons.filter(x => !x.endsWith('favicon.ico'))[0]})`}}/>
                        <MdBrokenImage/>
                    </div>
                    <a href={session.peerMeta.url} target="_blank" rel="noreferrer">
                        <div className="details">
                            { 
                                isLegacyWC(session) ?
                                    <ToolTip className="session-warning" label="dApp uses legacy WalletConnect bridge which is unreliable and often doesn't work. Please tell the dApp to update to the latest WalletConnect version.">
                                        <MdOutlineWarning/>
                                    </ToolTip>
                                    :
                                    null
                            }
                            {
                                isOffline ?
                                    <ToolTip className="session-error" label="WalletConnect connection may be offline. Check again later. If this warning persist try to disconnect and connect WalletConnect.">
                                        <AiOutlineDisconnect />
                                    </ToolTip>
                                    :
                                    null
                            }
                            <div className="name">{session.peerMeta.name}</div>
                        </div>
                    </a>
                    <div className="separator"></div>
                    <button onClick={() => disconnect(uri)}>Disconnect</button>
                </div>
          ))}
        </DropDown>
    )
}

export default DApps