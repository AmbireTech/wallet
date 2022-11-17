import styles from 'components/AddAccount/AddAccount.module.scss'
import { useParams } from 'react-router-dom'
import { useState } from 'react'
import networks from 'ambire-common/src/constants/networks'
import { fetchPost } from 'lib/fetch'

import useAccounts from 'hooks/accounts'
import { useLocalStorage } from 'hooks'

export default function OnRamp({relayerURL}) {
  const [onRampUrl, setOnRampUrl] = useState(false)
  const { selectedAcc } = useAccounts(useLocalStorage)
  const { chainID } = useParams()

  const openRamp = async () => {

    const validNetwork = networks.filter(network => network.chainId === parseInt(chainID))
    const networkCode = validNetwork.length ? validNetwork[0].nativeAssetSymbol : ''

    const fetchData = await fetchPost(`${relayerURL}/binance-connect/sign`, { address: selectedAcc, networkCode })
    const signature = encodeURIComponent(fetchData.signature)
    const merchantCode = fetchData.merchantCode
    const timestamp = fetchData.timestamp
    const iframeUrl = "https://www.binancecnt.com/en/pre-connect?merchantCode="+merchantCode+"&timestamp="+timestamp+"&cryptoAddress="+selectedAcc+"&cryptoNetwork="+networkCode+"&signature="+signature
    setOnRampUrl(iframeUrl)
  }

  const cancel = () => {
    window.parent.postMessage({
      address: selectedAcc,
      type: 'cancelRamp'
    }, '*')
  }

  return (
    <div className={styles.loginSignupWrapper}>
      <div className={styles.logo}/>
      {onRampUrl &&
        <div>
          <iframe src={onRampUrl} width="100%" height="500px" frameborder="0" title="Binance Connect" />
          <button onClick={cancel}>Finish</button>
        </div>
      }
      {!onRampUrl &&
        <section className={styles.addAccount}>
            <div>
              <h2>Buy Crypto with Fiat?</h2>
              <button id="proceed_btn" onClick={openRamp}>Proceed</button>
              <button onClick={cancel}>Cancel</button>
            </div>
        </section>
      }
    </div>
  )
}
