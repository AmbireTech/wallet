import { useLocation, withRouter, useParams } from 'react-router-dom'
import { useState } from 'react'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { isValidAddress } from 'ambire-common/src/services/address'
import cn from 'classnames'

import { Panel, Tabs } from 'components/common'
import Providers from 'components/Wallet/Deposit/Providers/Providers'
import Send from './Send/Send'
import Addresses from './Addresses/Addresses'

import styles from './Transfer.module.scss'

const Transfer = (props) => {
  const { portfolio, selectedNetwork, addressBook, selectedAcc, relayerURL } = props
  const { addresses, addAddress, removeAddress } = addressBook

  const { state } = useLocation()
  const { tokenAddressOrSymbol } = useParams()

  const tokenAddress = isValidAddress(tokenAddressOrSymbol)
    ? tokenAddressOrSymbol
    : portfolio.tokens.find(({ symbol }) => symbol === tokenAddressOrSymbol)?.address || null

  const [asset, setAsset] = useState(tokenAddress)
  const [gasTankDetails] = useState(state || null)
  const [address, setAddress] = useState(gasTankDetails ? accountPresets.feeCollector : '')

  const selectedAsset = portfolio?.tokens.find(({ address: tAddress }) => tAddress === asset)

  return (
    <div className={styles.wrapper}>
      {!gasTankDetails ? (
        <Tabs
          className={styles.tab}
          firstTabLabel="Send"
          secondTabLabel="Sell Crypto"
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
            <div className={styles.sell}>
              <Providers
                walletAddress={selectedAcc}
                networkDetails={selectedNetwork}
                relayerURL={relayerURL}
                portfolio={portfolio}
                sellMode
                selectedAsset={selectedAsset || null}
              />
            </div>
          }
          panelClassName={styles.panel}
        />
      ) : (
        <Panel className={cn(styles.panel, styles.sendOnly)}>
          <Send
            title={<h1 className={styles.gasTankSendTitle}>Send</h1>}
            {...props}
            address={address}
            setAddress={setAddress}
            gasTankDetails={gasTankDetails}
            asset={asset}
            setAsset={setAsset}
            tokenAddress={tokenAddress}
            selectedAsset={selectedAsset}
          />
        </Panel>
      )}
      {!gasTankDetails && (
        <Addresses
          selectedAsset={selectedAsset}
          selectedNetwork={selectedNetwork}
          addresses={addresses}
          addAddress={addAddress}
          removeAddress={removeAddress}
          onSelectAddress={(selectedAddress) => setAddress(selectedAddress)}
        />
      )}
    </div>
  )
}

export default withRouter(Transfer)
