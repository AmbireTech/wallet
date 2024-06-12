import { useLocation, withRouter, useParams } from 'react-router-dom'
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

  const [selectedAsset, setSelectedAsset] = useState(null)
  const [asset, setAsset] = useState(
    selectedAsset && `${selectedAsset.address}:${selectedAsset.symbol}`
  )
  const [gasTankDetails] = useState(state || null)
  const [address, setAddress] = useState(gasTankDetails ? accountPresets.feeCollector : '')

  // useEffect(()=>{
  //   if(!portfolio.tokens.find(({ address: itemAddress, symbol }) => itemAddress === `${itemAddress}:${symbol}` === asset))
  //     setAsset(null)
  // }, [selectedNetwork])

  useEffect(() => {
    let setTo
    if (asset) {
      setTo = portfolio.tokens.find(({ address:itemAddress, symbol }) => `${itemAddress}:${symbol}` === asset)
    } else {
      setTo = portfolio.tokens.find(({ address: itemAddress, symbol }) =>
        [itemAddress, symbol].includes(tokenAddressOrSymbol)
      )
    }
    setSelectedAsset(setTo)
  }, [asset, selectedNetwork])

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
              setAsset={(i)=>{console.log(i)
                setAsset(i)}}
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
