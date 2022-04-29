import './AssetsMigration.scss'
import assetMigrationDetector from 'lib/assetMigrationDetector'
import AssetsMigrationModal from 'components/Modals/AssetsMigrationModal/AssetsMigrationModal'
import { useCallback, useEffect, useState } from 'react'
import { useModals } from 'hooks'
import { FaTimes } from 'react-icons/fa'

const AssetsMigrationBanner = ({ addRequest, selectedAccount, accounts, selectedNetwork, relayerURL, portfolio, closeable = false, linkMargin = false }) => {

  const [hasSignerAssets, setHasSignerAssets] = useState(false)
  const [migrationMessageSeen, setMigrationMessageSeen] = useState(false)
  const { showModal } = useModals()

  const closeMigrationMessage = useCallback(() => {
    setMigrationMessageSeen(true)
    localStorage.setItem('migrationMessageSeen_' + selectedAccount + selectedNetwork.id, "1")
  }, [selectedAccount, selectedNetwork])

  //fetching relevant assets
  useEffect(() => {
    setHasSignerAssets(false)
    const checkSignerAssets = ({ networkId, identityAccount, accounts }) => {
      const currentAccount = accounts.find(a => a.id === identityAccount)
      if (!currentAccount.signer) return

      assetMigrationDetector({ networkId: networkId, account: currentAccount.signer.address }).then(assets => {
        const relevantAssets = assets.filter(a => a.balanceUSD > 0.001)
        setHasSignerAssets(!!relevantAssets.length)
      }).catch(err => {
        console.error(err)
      })
    }

    checkSignerAssets({ identityAccount: selectedAccount, networkId: selectedNetwork.id, accounts })
  }, [selectedAccount, selectedNetwork, accounts])

  //checking if closable message has been seen(closed) or not
  useEffect(() => {
    setMigrationMessageSeen(closeable && !!localStorage.getItem('migrationMessageSeen_' + selectedAccount + selectedNetwork.id))
  }, [closeable, selectedAccount, selectedNetwork])

  return (
    (hasSignerAssets && !migrationMessageSeen) &&
    <div className={'migration-banner'}>
      <div className='migration-banner-message'>
        <div>We detected that your signer account has ERC20 tokens that could be migrated to your Ambire wallet.</div>
        <span className={'link' + (linkMargin ? ' link-margin' : '')} onClick={() => {
          showModal(<AssetsMigrationModal
            addRequest={addRequest}
            selectedNetwork={selectedNetwork}
            selectedAccount={selectedAccount}
            accounts={accounts}
            relayerURL={relayerURL}
            portfolio={portfolio}
          />)
        }}>Click here to migrate those tokens</span>
      </div>
      {
        closeable &&
        <div className={'migration-banner-close'}><FaTimes onClick={() => closeMigrationMessage()}/></div>
      }
    </div>
  )
}

export default AssetsMigrationBanner
