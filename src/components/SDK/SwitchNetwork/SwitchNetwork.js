import { useState } from 'react'
import cn from 'classnames'

import { Button } from 'components/common'

import styles from './SwitchNetwork.module.scss'
import Networks from './Networks/Networks'

const SwitchNetwork = () => {
  const [supported, setSupported] = useState(true)

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Switch Network Request</h1>
      <div className={styles.body}>
        {/* Placeholder logo */}
        <div className={styles.siteLogo} />
        <h2 className={styles.siteName}>app.pooltogether.com</h2>
        <p className={cn(styles.message, {[styles.smallMb]: !supported})}>
          {supported ? 'Allow this site to switch the network?' : "Ambire Wallet doesn't support this network"}
        </p>
        {supported ? <Networks
          fromNetworkId="polygon"
          fromNetworkName="Polygon"
          toNetworkId="ethereum"
          toNetworkName="Ethereum"
        /> : null}
      </div>
      {supported ? (
        <div className={styles.buttons}>
          <Button size="sm" variant="danger" className={styles.button}>
            Reject
          </Button>
          <Button size="sm" variant="primaryGradient" className={styles.button} onClick={() => setSupported((prev) => !prev)}>
            Switch Network
          </Button>
        </div>
      ) : (
        <Button
          variant="danger"
          size="sm"
          className={cn(styles.button, styles.singleButton)}
          onClick={() => setSupported((prev) => !prev)}
        >
          Deny
        </Button>
      )}
    </div>
  )
}

export default SwitchNetwork
