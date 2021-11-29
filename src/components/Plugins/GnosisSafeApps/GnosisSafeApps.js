import './GnosisSafeApps.scss'
import GnosisSafeAppIframe from './GnosisSafeAppIframe'

import { useState } from 'react'

const dapps = [{
  name: 'LocalTest',
  url: 'http://localhost:3002',
  logo: 'http://localhost:3002/logo-test.png',
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
},
{
  name: 'MEW',
  url: 'https://www.myetherwallet.com/wallet/sign',
  logo: 'https://www.myetherwallet.com/wallet/sign/logo.svg',
  desc: 'MEW as dapp'
},
]

export default function GnosisSafeApps({
  network,
  selectedAcc,
  gnosisConnect,
  gnosisDisconnect
}) {

  const [selectedApp, setSelectedApp] = useState(null)

  return (
    <div id="plugin-gnosis-container">
      <ul id="dapps-container" className={selectedApp ? 'small-thumbs' : ''}>
        {dapps.map((dapp, index) => (
          <li
            key={index}
            onClick={() => setSelectedApp(dapp)}
            className={(selectedApp && dapp.url === selectedApp.url) ? 'selected' : ''}
          >
            <div className="logo-container" style={{ backgroundImage: `url(${dapp.logo})` }}></div>
            <div className="dapp-name">{dapp.name}</div>
            <div className="dapp-desc">{dapp.desc}</div>
          </li>
        ))}
      </ul>
      {selectedApp &&
        <GnosisSafeAppIframe
          network={network}
          selectedApp={selectedApp}
          selectedAcc={selectedAcc}
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}

        />
      }
    </div>)
}
