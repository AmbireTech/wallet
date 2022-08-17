import { MdOutlineAdd, MdRemove } from 'react-icons/md'
import './GnosisSafeApps.scss'
import GnosisSafeAppIframe from './GnosisSafeAppIframe'
import { useLocalStorage } from 'hooks'
import InputModal from 'components/Modals/InputModal/InputModal'
import { Button } from 'components/common'

import { useModals } from 'hooks'
import { useCallback, useState } from 'react'

const dapps = [{
  name: 'LocalTest',
  url: 'http://localhost:3002',
  logo: 'http://localhost:3002/logo-test.png',
  desc: 'Local dapp test with some lorem ipsum stuff'
},
{
  name: 'TxBuilder',
  url: 'https://safe-apps.dev.gnosisdev.com/tx-builder/',
  logo: 'https://safe-apps.dev.gnosisdev.com/tx-builder/logo.svg',
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
  const { showModal } = useModals()
  const [selectedApp, setSelectedApp] = useState(null)
  const [customPlugins, setCustomPlugins] = useLocalStorage({ key: 'gnosisCustomApps', defaultValue: [] })

  const modalInputs = [
    { label: 'Name', placeholder: 'Plugin name', validate: value => !!value },
    { label: 'URL', placeholder: 'https://plugyourpluginifyouwantplug', validate: value => !!value }
  ]

  const addPlugin = useCallback((name, url) => {
    const newDapp = { name, url, customId: Date.now()  }
    const newPlugins = [...customPlugins, newDapp]
    setCustomPlugins(newPlugins)
    setSelectedApp(newDapp)
  }, [customPlugins, setCustomPlugins])

  const removeCustomPlugin = useCallback((customId) => {
    const newPlugins = [...customPlugins.filter(x => x.customId !== customId)]
    setCustomPlugins(newPlugins)
  }, [customPlugins, setCustomPlugins])

  const inputModal =
    <InputModal
      title="Add New Address"
      inputs={modalInputs}
      onClose={([name, url]) => addPlugin(name, url)}>
    </InputModal>

  const showInputModal = () => showModal(inputModal)

  return (
    <div id="plugin-gnosis-container">
      <ul id="dapps-container" className={selectedApp ? 'small-thumbs' : ''}>
        <li className='add-plugin'>
          <Button mini icon={<MdOutlineAdd />} onClick={showInputModal}>Add plugin</Button>
        </li>
        {[...dapps, ...customPlugins].map((dapp, index) => (
          <li
            key={index}
            onClick={() => setSelectedApp(dapp)}
            className={(selectedApp && dapp.url === selectedApp.url) ? 'selected' : ''}
          >
            {dapp.customId && <Button className='remove-btn' mini red icon={<MdRemove />} onClick={() => removeCustomPlugin(dapp.customId)} />}
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
          removeApp={removeCustomPlugin}
          gnosisConnect={gnosisConnect}
          gnosisDisconnect={gnosisDisconnect}

        />
      }
    </div>
  )
}
