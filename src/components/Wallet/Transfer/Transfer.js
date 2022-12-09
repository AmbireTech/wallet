import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { withRouter } from 'react-router'
import { useParams } from 'react-router'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { isValidAddress } from 'ambire-common/src/services/address'

import Send from './Send/Send'
import Sell from './Sell/Sell'
import Addresses from './Addresses/Addresses'

import networks from 'consts/networks'

import styles from './Transfer.module.scss'
import Tabs from 'components/common/Tabs/Tabs'

const Transfer = (props) => {
    const { portfolio, selectedNetwork, addressBook, selectedAcc, relayerURL } = props
    const { addresses, addAddress, removeAddress } = addressBook

    const networkDetails = networks.find(({ id }) => id === selectedNetwork.id)
    
    const { state } = useLocation()
    const { tokenAddressOrSymbol } = useParams()
    
    const tokenAddress = isValidAddress(tokenAddressOrSymbol) ? tokenAddressOrSymbol : portfolio.tokens.find(({ symbol }) => symbol === tokenAddressOrSymbol)?.address || null

    const [asset, setAsset] = useState(tokenAddress)
    const [gasTankDetails] = useState(state ? state : null)
    const [address, setAddress] = useState(gasTankDetails ? accountPresets.feeCollector : '')
    
    const selectedAsset = portfolio?.tokens.find(({ address }) => address === asset)

    return (
        <div className={styles.wrapper}>
            <Tabs 
                firstTabLabel='Send'
                secondTabLabel='Sell Crypto'
                firstTab={
                    <Send 
                        {...props}
                        address={address} 
                        setAddress={setAddress} 
                        gasTankDetails={gasTankDetails} 
                        asset={asset} 
                        setAsset={setAsset} 
                        tokenAddress={tokenAddress} 
                        selectedAsset={selectedAsset} 
                    />
                }
                secondTab={
                    <Sell 
                        walletAddress={selectedAcc}
                        networkDetails={networkDetails}
                        relayerURL={relayerURL}
                        portfolio={portfolio}
                        selectedAsset={selectedAsset}
                    />
                }
                panelClassName={styles.panel}
            />
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