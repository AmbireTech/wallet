import styles from 'components/AddAccount/AddAccount.module.scss'

import useAccounts from 'hooks/accounts'
import { useLocalStorage } from 'hooks'

export default function OnRamp() {
  // to do: just show two buttons for now:
  // one is going to binance connect
  // the other is just canceling the on ramp

  const { selectedAcc } = useAccounts(useLocalStorage)

  const openRamp = () => {
    window.parent.postMessage({
      type: 'openRamp'
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
