import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { useModals } from 'hooks'
import { Loading } from 'components/common'
import AddOrHideButton from 'components/Wallet/Dashboard/AddOrHideButton/AddOrHideButton'
import HideCollectibleModal from 'components/Modals/HideCollectibleModal/HideCollectibleModal'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import CollectiblesWrapper from './CollectiblesWrapper/CollectiblesWrapper'
import Collectible from './Collectible/Collectible'

const handleUri = (uri) => {
  if (!uri) return ''
  uri = uri.startsWith('data:application/json')
    ? uri.replace('data:application/json;utf8,', '')
    : uri

  if (uri.split('/').length === 1) return `https://ipfs.io/ipfs/${uri}`
  if (uri.split('/')[0] === 'data:image') return uri
  if (uri.startsWith('ipfs://'))
    return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
  if (uri.split('/')[2].endsWith('mypinata.cloud'))
    return `https://ipfs.io/ipfs/${uri.split('/').slice(4).join('/')}`

  return uri
}

const Collectibles = ({ portfolio, isPrivateMode, selectedNetwork, footer }) => {
  const { showModal } = useModals()
  const history = useHistory()
  const collectiblesList = portfolio.collectibles
  const [isHideCollectiblesModalOpen, setIsHideCollectiblesModalOpen] = useState(false)

  useEffect(() => history.replace('/wallet/dashboard/collectibles'), [history])

  const openHideCollectibleModal = useCallback(() => setIsHideCollectiblesModalOpen(true), [])

  useEffect(() => {
    if (isHideCollectiblesModalOpen) {
      showModal(
        <HideCollectibleModal
          portfolio={portfolio}
          setIsHideCollectiblesModalOpen={setIsHideCollectiblesModalOpen}
          handleUri={handleUri}
        />
      )
    }
  }, [portfolio, isHideCollectiblesModalOpen, showModal])

  if (portfolio.loading) return <Loading />

  if (!portfolio.collectibles.length || isPrivateMode) {
    return (
      <CollectiblesPlaceholder
        isPrivateMode={isPrivateMode}
        collectiblesLength={portfolio.collectibles.length}
        onClickShowCollectible={openHideCollectibleModal}
        footer={footer}
      />
    )
  }

  return (
    <CollectiblesWrapper
      wrapperEndChildren={
        <>
          <AddOrHideButton onClick={openHideCollectibleModal}>Hide Collectible</AddOrHideButton>
          {footer}
        </>
      }
    >
      {collectiblesList.map(({ network, address, collectionName, assets, balanceUSD }) =>
        (assets || []).map(({ tokenId, name, data }) => (
          <Collectible
            key={tokenId}
            href={`/wallet/nft/${selectedNetwork.id}/${address}/${tokenId}`}
            collectionIcon={data && data.image}
            collectionName={collectionName}
            name={(data && data.name) || name || collectionName}
            image={handleUri(data && data.image)}
            price={balanceUSD.toFixed(2)}
          />
        ))
      )}
    </CollectiblesWrapper>
  )
}

export default Collectibles
