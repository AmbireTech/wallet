import cn from 'classnames'
import { useCallback, useEffect, useState } from 'react'
import { Panel } from 'components/common'
import QRCode from 'qrcode'
import TextInput from 'components/common/TextInput/TextInput'
import OfflineWrapper from 'components/OfflineWrapper/OfflineWrapper'
import networks from 'consts/networks'

import AssetsMigrationBanner from 'components/common/AssetsMigrationBanner/AssetsMigrationBanner'
import Providers from './Providers/Providers'

import styles from './Deposit.module.scss'

export default function Deposit({
  selectedAcc,
  selectedNetwork,
  accounts,
  addRequest,
  relayerURL,
  portfolio,
  useStorage
}) {
  const networkDetails = networks.find(({ id }) => id === selectedNetwork.id)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  const generateQRCode = useCallback(() => {
    QRCode.toDataURL(
      selectedAcc,
      {
        quality: 1,
        margin: 1
      },
      (error, url) => {
        if (error) return console.error(error)
        setQrCodeUrl(url)
      }
    )
  }, [selectedAcc])

  useEffect(() => generateQRCode(), [generateQRCode])

  return (
    <OfflineWrapper>
      <section className={styles.deposit}>
        <Panel className={styles.panel}>
          <div className={styles.heading}>
            <div className={styles.title}>Deposit Tokens</div>
            <div className={styles.subtitle}>Direct Deposit</div>
          </div>
          <div className={styles.description}>
            <TextInput
              className={styles.depositAddress}
              labelClassName={styles.textInputLabel}
              inputContainerClass={styles.inputClass}
              label={`Send ${networkDetails.nativeAssetSymbol}, tokens or collectibles (NFTs) to this address:`}
              value={selectedAcc}
              copy
            />
            <img className={styles.qrCode} alt="QR Code" src={qrCodeUrl} />
          </div>
          <div className={styles.networks}>
            <label className={styles.networksTitle}>
              Following networks supported on this address:
            </label>
            <div className={styles.list}>
              {networks
                .filter((n) => !n.hide)
                .map(({ id, icon, name }) => (
                  <div className={styles.network} key={id}>
                    <div className={styles.icon} style={{ backgroundImage: `url(${icon})` }} />
                    <div className={styles.name}>{id === 'binance-smart-chain' ? 'BSC' : name}</div>
                  </div>
                ))}
            </div>
          </div>
          <AssetsMigrationBanner
            selectedNetwork={selectedNetwork}
            selectedAccount={selectedAcc}
            accounts={accounts}
            addRequest={addRequest}
            linkMargin
            relayerURL={relayerURL}
            portfolio={portfolio}
            useStorage={useStorage}
          />
        </Panel>
        <Panel className={styles.panel}>
          <div className={styles.heading}>
            <div className={styles.title}>Fiat Currency</div>
            <div className={styles.subtitle}>Credit Card & Bank Transfer</div>
          </div>
          <div className={cn(styles.description, styles.margin)}>
            Deposit with credit card to your account directly using one of our partners
          </div>
          <Providers
            walletAddress={selectedAcc}
            networkDetails={networkDetails}
            relayerURL={relayerURL}
            portfolio={portfolio}
          />
        </Panel>
      </section>
    </OfflineWrapper>
  )
}
