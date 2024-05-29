import { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'

import { useModals } from 'hooks'
import { Loading } from 'components/common'
import AddOrHideButton from 'components/Wallet/Dashboard/AddOrHideButton/AddOrHideButton'
import HideCollectibleModal from 'components/Modals/HideCollectibleModal/HideCollectibleModal'
import CollectiblesPlaceholder from './CollectiblesPlaceholder/CollectiblesPlaceholder'
import CollectiblesWrapper from './CollectiblesWrapper/CollectiblesWrapper'
import Collectible from './Collectible/Collectible'


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
            image={data && data.image}
            price={balanceUSD.toFixed(2)}
          />
        ))
      )}
    </CollectiblesWrapper>
  )
}

export default Collectibles
