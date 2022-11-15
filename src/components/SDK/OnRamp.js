import styles from 'components/AddAccount/AddAccount.module.scss'
import { useParams } from 'react-router-dom'
import networks from 'ambire-common/src/constants/networks'
import { fetchPost } from 'lib/fetch'

import useAccounts from 'hooks/accounts'
import { useLocalStorage } from 'hooks'

export default function OnRamp({relayerURL}) {
  const { selectedAcc } = useAccounts(useLocalStorage)
  const { chainID } = useParams()

  const openRamp = async () => {

    const validNetwork = networks.filter(network => network.chainId === parseInt(chainID))
    const networkCode = validNetwork.length ? validNetwork[0].nativeAssetSymbol : ''

    const fetchSignature = await fetchPost(`${relayerURL}/binance-connect/sign`, { chainID, networkCode })
    const signature = fetchSignature.signature

    window.parent.postMessage({
      type: 'openRamp',
      address: selectedAcc,
      networkCode: networkCode,
      signature: signature,
    }, '*')
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
      <section className={styles.addAccount}>
        <div>
          <h2>Buy Crypto with Fiat?</h2>
          <button onClick={openRamp}>Proceed</button>
          <button onClick={cancel}>Cancel</button>
        </div>
      </section>
    </div>
  )
}
