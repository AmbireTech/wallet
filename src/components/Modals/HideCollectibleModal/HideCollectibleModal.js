import { useEffect, useMemo } from 'react'

import { useModals } from 'hooks'
import { Button, Modal } from 'components/common'
import { MdVisibilityOff as VisibleIcon, MdRemoveRedEye as HiddenIcon } from 'react-icons/md'
import Collectible from './Collectible/Collectible'

import styles from './HideCollectibleModal.module.scss'

const HideCollectibleModal = ({ portfolio, setIsHideCollectiblesModalOpen, handleUri }) => {
  const { hideModal, setOnClose } = useModals()
  const { hiddenCollectibles, onAddHiddenCollectible, onRemoveHiddenCollectible, collectibles } =
    portfolio

  const hideCollectible = (collectible, assetId) => onAddHiddenCollectible(collectible, assetId)

  const unhideCollectible = (collectible, assetId) =>
    onRemoveHiddenCollectible(collectible.address, assetId)

  const sortedCollectibles = useMemo(() => {
    const tempCollectibles = collectibles.concat(hiddenCollectibles)
    return [
      ...new Map(tempCollectibles.map((collectible) => [collectible.address, collectible])).values()
    ]
  }, [collectibles, hiddenCollectibles])

  const handleHideModal = () => {
    setIsHideCollectiblesModalOpen(false)
    hideModal()
  }

  useEffect(() => {
    setOnClose({ close: () => setIsHideCollectiblesModalOpen(false) })
  }, [setOnClose, setIsHideCollectiblesModalOpen])

  return (
    <Modal
      className={styles.wrapper}
      contentClassName={styles.content}
      title="Hide Collectible"
      buttons={
        <Button small className={styles.closeButton} onClick={handleHideModal}>
          Close
        </Button>
      }
      isCloseBtnShown={false}
    >
      {sortedCollectibles.map((collectible) =>
        (collectible.assets || []).map((asset) => (
          <Collectible
            key={collectible.address}
            asset={asset}
            button={
              !asset.isHidden ? (
                <HiddenIcon
                  className={styles.icon}
                  color="#27e8a7"
                  onClick={() => hideCollectible(collectible, asset.tokenId)}
                />
              ) : (
                <VisibleIcon
                  className={styles.icon}
                  color="#F21A61"
                  onClick={() => unhideCollectible(collectible, asset.tokenId)}
                />
              )
            }
            handleUri={handleUri}
          />
        ))
      )}
    </Modal>
  )
}

export default HideCollectibleModal
