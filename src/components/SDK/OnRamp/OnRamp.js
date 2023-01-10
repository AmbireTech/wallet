import React from 'react'
import networks from 'ambire-common/src/constants/networks'

import binanceNetworks from './helpers/binanceNetworks'
import { fetchPost } from 'lib/fetch'

import { useLocalStorage, useAccounts } from 'hooks'
import { Button } from 'components/common'

import { ReactComponent as Illustration } from './images/illustration.svg'

import styles from './OnRamp.module.scss'

const OnRamp = ({ relayerURL }) => {
  const { selectedAcc } = useAccounts(useLocalStorage)
  const chosenNetwork = React.createRef()
  const networkCodes = networks
    .filter((network) => network.id in binanceNetworks)
    .map((network) => ({
      code: binanceNetworks[network.id],
      name: network.name,
    }))

  const handleBuyCrypto = async () => {
    const networkCode = chosenNetwork.current.value
    const fetchData = await fetchPost(`${relayerURL}/binance-connect/sign`, { address: selectedAcc, networkCode })
    const signature = encodeURIComponent(fetchData.signature)
    const { merchantCode, timestamp } = fetchData

    const iframeUrl = `https://www.binancecnt.com/en/pre-connect?merchantCode=${merchantCode}&timestamp=${timestamp}&cryptoAddress=${selectedAcc}&cryptoNetwork=${networkCode}&signature=${signature}`
    window.open(iframeUrl, 'binance-connect', 'menubar=1,resizable=1,width=400,height=640')
  }

  const handleFinalize = () => {
    window.parent.postMessage(
      {
        address: selectedAcc,
        type: 'finishRamp',
      },
      '*'
    )
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Do you want to buy crypto?</h1>
      <Illustration className={styles.illustration} />
      <select ref={chosenNetwork}>
        {networkCodes.map((network, id) => (
          <option key={id} value={network.code}>
            {network.name}
          </option>
        ))}
      </select>
      <div className={styles.buttons}>
        <Button border small className={styles.button} onClick={handleBuyCrypto}>
          Buy Crypto with Fiat
        </Button>
        <Button primaryGradient small className={styles.button} onClick={handleFinalize}>
          Finalize Registration
        </Button>
      </div>
    </div>
  )
}

export default OnRamp
