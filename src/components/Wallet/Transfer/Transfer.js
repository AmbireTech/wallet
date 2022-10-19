import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { withRouter } from 'react-router'
import { useParams } from 'react-router'
import cn from 'classnames'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { isValidAddress } from 'ambire-common/src/services/address'

import { Panel } from 'components/common'
import Send from './Send/Send'
import Sell from './Sell/Sell'
import Addresses from './Addresses/Addresses'

import networks from 'consts/networks'

import styles from './Transfer.module.scss'

const Transfer = (props) => {
    const { portfolio, selectedNetwork, addressBook, selectedAcc, relayerURL } = props
    const { addresses, addAddress, removeAddress } = addressBook

    const networkDetails = networks.find(({ id }) => id === selectedNetwork.id)
    
    const { state } = useLocation()
    const { tokenAddressOrSymbol } = useParams()
    
    const tokenAddress = isValidAddress(tokenAddressOrSymbol) ? tokenAddressOrSymbol : portfolio.tokens.find(({ symbol }) => symbol === tokenAddressOrSymbol)?.address || null

    const [asset, setAsset] = useState(tokenAddress)
    const [gasTankDetails] = useState(state ? state : null)
    const [currentTab, setCurrentTab] = useState('send')
    const [address, setAddress] = useState(gasTankDetails ? accountPresets.feeCollector : '')
    
    const selectedAsset = portfolio?.tokens.find(({ address }) => address === asset)

    const handleOpenSend = () => setCurrentTab('send')

    const handleOpenSell = () => setCurrentTab('sell')

    return (
        <div className={styles.wrapper} style={{ justifyContent: gasTankDetails ? 'center' : '' }}>
           <Panel className={styles.panel}>
                <div className={styles.tabs}>
                    <button 
                        onClick={handleOpenSend}
                        className={cn(styles.tabsButton, {[styles.active]: currentTab === 'send'})}
                    >
                        Send
                    </button>
                    <button 
                        onClick={handleOpenSell}
                        className={cn(styles.tabsButton, {[styles.active]: currentTab === 'sell'})}
                    >
                        Sell Crypto
                    </button>
                </div>
                {currentTab === 'send' ? <Send 
                    {...props}
                    address={address} 
                    setAddress={setAddress} 
                    gasTankDetails={gasTankDetails} 
                    asset={asset} 
                    setAsset={setAsset} 
                    tokenAddress={tokenAddress} 
                    selectedAsset={selectedAsset} 
                /> : <Sell 
                    walletAddress={selectedAcc}
                    networkDetails={networkDetails}
                    relayerURL={relayerURL}
                    portfolio={portfolio}
                />}
           </Panel>
           {!gasTankDetails && <Addresses
                selectedAsset={selectedAsset}
                selectedNetwork={selectedNetwork}
                addresses={addresses}
                addAddress={addAddress}
                removeAddress={removeAddress}
                onSelectAddress={address => setAddress(address)}
            />}
        </div>
    )
}

export default withRouter(Transfer)