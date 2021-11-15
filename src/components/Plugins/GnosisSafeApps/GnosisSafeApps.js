import './GnosisSafeApps.scss'

import {useEffect, useRef, useState} from 'react'

const dapps = [{
  name: 'LocalTest',
  url: 'http://localhost:3003',
  logo: 'http://localhost:3003/logo-test.png',
  desc: 'Local dapp test with some lorem ipsum stuff'
},
  {
    name: 'ParaSwap',
    url: 'https://paraswap.io',
    logo: 'https://paraswap.io/paraswap.svg',
    desc: 'ParaSwap allows dApps and traders to get the best DEX liquidity by aggregating multiple markets and offering the best rates'
  },
  {
    name: '0xPlasma Finance',
    url: 'https://apy.plasma.finance',
    logo: 'https://apy.plasma.finance/logo.svg',
    desc: 'Cross-chain DeFi & DEX aggregator, farming, asset management, fiat on-ramp'
  }
]

export default function GnosisSafeApps({network, selectedAcc, gnosisConnect, gnosisDisconnect}) {

  const iframeRef = useRef(null)
  const [selectedApp, setSelectedApp] = useState(null)

  //to refresh iframe
  const genHash = () => {
    return selectedApp?.url + network.chainId + selectedAcc
  }

  useEffect(() => {
    if (selectedApp) {
      gnosisConnect({
        selectedAcc: selectedAcc,
        iframeRef: iframeRef,
        app: selectedApp
      })
    }

    return () => {
      gnosisDisconnect()
    }
  }, [selectedApp, network, selectedAcc, iframeRef, gnosisConnect, gnosisDisconnect])

  return (
    <div id="plugin-gnosis-conainer">
      {selectedApp ? (
        <iframe title='Ambire Plugin' key={genHash()} ref={iframeRef} src={selectedApp.url}/>
      ) : (
        <ul id="dapps-container">
          {dapps.map((dapp, index) => (
            <li key={index} onClick={() => setSelectedApp(dapp)}>
              <div className="logo-container" style={{backgroundImage: `url(${dapp.logo})`}}></div>
              <div className="dapp-name">{dapp.name}</div>
              <div className="dapp-desc">{dapp.desc}</div>
            </li>
          ))}
        </ul>
      )}
    </div>)
}
