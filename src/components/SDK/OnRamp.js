import styles from 'components/AddAccount/AddAccount.module.scss'
import networks from 'ambire-common/src/constants/networks'
import { NETWORKS as enumNETWORKS } from 'ambire-common/src/constants/networks'
import { fetchPost } from 'lib/fetch'
import React from 'react'

import useAccounts from 'hooks/accounts'
import { useLocalStorage } from 'hooks'

const binanceNetworks = {
  [enumNETWORKS.ethereum]: 'ETH',
  [enumNETWORKS.polygon]: 'MATIC',
  [enumNETWORKS['binance-smart-chain']]: 'BSC',
  [enumNETWORKS.avalanche]: 'AVAXC',
  [enumNETWORKS.moonriver]: 'MOVR',
  [enumNETWORKS.moonbeam]: 'GLMR',
  [enumNETWORKS.fantom]: 'FTM',
  [enumNETWORKS.arbitrum]: 'ARBITRUM',
  [enumNETWORKS.optimism]: 'OPTIMISM',
}

export default function OnRamp({relayerURL}) {
  const { selectedAcc } = useAccounts(useLocalStorage)
  const chosenNetwork = React.createRef();
  const networkCodes = networks.filter(network => (network.id in binanceNetworks)).map(network => ({
    code: binanceNetworks[network.id], name: network.name
  }))

  const openRamp = async () => {

    const networkCode = chosenNetwork.current.value
    const fetchData = await fetchPost(`${relayerURL}/binance-connect/sign`, { address: selectedAcc, networkCode })
    const signature = encodeURIComponent(fetchData.signature)
    const merchantCode = fetchData.merchantCode
    const timestamp = fetchData.timestamp
    const iframeUrl = "https://www.binancecnt.com/en/pre-connect?merchantCode="+merchantCode+"&timestamp="+timestamp+"&cryptoAddress="+selectedAcc+"&cryptoNetwork="+networkCode+"&signature="+signature
    window.open(iframeUrl,"binance-connect","menubar=1,resizable=1,width=400,height=640")
  }

  const finish = () => {
    window.parent.postMessage({
      address: selectedAcc,
      type: 'finishRamp'
    }, '*')
  }

  return (
    <div className={styles.loginSignupWrapper}>
      <div className={styles.logo}/>
      <section className={styles.addAccount}>
          <div>
            <h2>Buy Crypto with Fiat?</h2>
            <p>Choose network</p>
            <select ref={chosenNetwork}>
              {networkCodes.map((network, id) =>
                <option key={id} value={network.code}>{network.name}</option>
              )}
            </select>
            <button id="proceed_btn" onClick={openRamp}>Proceed</button>
            <button onClick={finish}>Finish</button>
          </div>
      </section>
    </div>
  )
}
