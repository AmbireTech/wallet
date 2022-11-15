import styles from 'components/AddAccount/AddAccount.module.scss'
import { useParams } from 'react-router-dom'
import networks from 'ambire-common/src/constants/networks'

import useAccounts from 'hooks/accounts'
import { useLocalStorage } from 'hooks'

export default function OnRamp() {
  const { selectedAcc } = useAccounts(useLocalStorage)
  const { chainID } = useParams()

  const openRamp = () => {
    // TO DO:
    // send an HTTP request to the relayer
    // sign the message and return it

    const validNetwork = networks.filter(network => network.chainId === parseInt(chainID))
    const networkCode = validNetwork.length ? validNetwork[0].nativeAssetSymbol : ''

    window.parent.postMessage({
      type: 'openRamp',
      address: selectedAcc,
      networkCode: networkCode,
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
