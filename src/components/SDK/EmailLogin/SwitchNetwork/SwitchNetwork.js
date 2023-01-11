import { useEffect } from 'react'
import cn from 'classnames'

import { useSDKContext } from 'components/SDK/SDKWrapper/SDKWrapper'
import { Button } from 'components/common'
import Networks from './Networks/Networks'

import styles from './SwitchNetwork.module.scss'

const SwitchNetwork = ({
  fromNetworkId,
  fromNetworkName,
  toNetworkId,
  toNetworkName,
  onConfirm,
  onReject,
  supported,
}) => {
  const { setIsBackButtonVisible } = useSDKContext()

  useEffect(() => {
    setIsBackButtonVisible(false)
  }, [setIsBackButtonVisible])

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Switch Network Request</h1>
      <div className={styles.body}>
        <img src={`${document.referrer}/favicon.png`} alt="site-logo" className={styles.siteLogo} />
        <h2 className={styles.siteName}>{document.referrer}</h2>
        <p className={cn(styles.message, { [styles.smallMb]: !supported })}>
          {supported ? 'Allow this site to switch the network?' : "Ambire Wallet doesn't support this network"}
        </p>
        {supported ? (
          <Networks
            fromNetworkId={fromNetworkId}
            fromNetworkName={fromNetworkName}
            toNetworkId={toNetworkId}
            toNetworkName={toNetworkName}
          />
        ) : null}
      </div>
      {supported ? (
        <div className={styles.buttons}>
          <Button small danger className={styles.button} onClick={onReject}>
            Reject
          </Button>
          <Button small primaryGradient className={styles.button} onClick={onConfirm}>
            Switch Network
          </Button>
        </div>
      ) : (
        <Button danger small className={cn(styles.button, styles.singleButton)} onClick={onReject}>
          Deny
        </Button>
      )}
    </div>
  )
}

export default SwitchNetwork
