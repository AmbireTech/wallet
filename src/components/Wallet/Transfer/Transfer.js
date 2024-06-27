import { useLocation, withRouter, useParams, useMemo } from 'react-router-dom'
import { useEffect, useState } from 'react'
import accountPresets from 'ambire-common/src/constants/accountPresets'
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

  const initialSelectedAsset = portfolio.tokens.find(({ address: itemAddress, symbol }) =>
    [itemAddress, symbol].includes(tokenAddressOrSymbol))

  const [selectedAsset, setSelectedAsset] = useState(initialSelectedAsset)
  
  const [assetAddrWithSymbol, setAsset] = useState(
    selectedAsset && `${selectedAsset.address}:${selectedAsset.symbol}`
  )
  
  useEffect(()=>{
    setAsset(selectedAsset && `${selectedAsset.address}:${selectedAsset.symbol}`)
  }, [portfolio])

  const [gasTankDetails] = useState(state || null)
  const [address, setAddress] = useState(gasTankDetails ? accountPresets.feeCollector : '')

  useEffect(() => {
    let setTo
    if (assetAddrWithSymbol) {
      setTo = portfolio.tokens.find(
        ({ address: itemAddress, symbol }) => `${itemAddress}:${symbol}` === assetAddrWithSymbol )
    } else {
      setTo = portfolio.tokens.find(({ address: itemAddress, symbol }) =>
        [itemAddress, symbol].includes(tokenAddressOrSymbol)
      )
    }
    setSelectedAsset(setTo)
  }, [assetAddrWithSymbol, selectedNetwork, portfolio.tokens, tokenAddressOrSymbol])

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
              asset={assetAddrWithSymbol}
              setAsset={setAsset}
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
            asset={assetAddrWithSymbol}
            setAsset={setAsset}
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
