import './HideCollectibleModal.scss'

import { Button, Modal } from 'components/common'
import {
  MdOutlineClose,
  MdVisibilityOff as VisibleIcon,
  MdRemoveRedEye as HiddenIcon
} from 'react-icons/md'
import { useModals } from 'hooks'
import { useEffect, useMemo } from 'react'

const Token = ({ token, button, handleUri, asset }) => (
  <div className="extra-token" key={token.address}>
    <div className="info">
      <div className="icon" style={{ backgroundImage: `url(${handleUri(asset.data.image)})` }}/>
      <div className="name">
        <span>
          {asset.data.name} 
        </span>
      </div>
    </div>
    {button}
  </div>
)

const HideCollectibleModal = ({ portfolio, setIsHideTokenModalOpen, handleUri }) => {
  const { hideModal, setOnClose } = useModals()
  const { hiddenCollectibles, onAddHiddenCollectible, onRemoveHiddenCollectible, collectibles } = portfolio

  const hideToken = (token, assetId) => onAddHiddenCollectible(token, assetId)

  const unhideToken = (token, assetId) => onRemoveHiddenCollectible(token.address, assetId)

  const sortedCollectibles = useMemo(() => {
    const tempTokens = collectibles.concat(hiddenCollectibles)
    return [...new Map(tempTokens.map(token => [token.address, token])).values()]
  }, [collectibles, hiddenCollectibles])

  const handleHideModal = () => {
    setIsHideTokenModalOpen(false)
    hideModal()
  }

  useEffect(() => {
    setOnClose({close: () => setIsHideTokenModalOpen(false)})
  }, [setOnClose, setIsHideTokenModalOpen])

  return (
    <Modal id="hide-collectible-modal" title="Hide Collectible">
      <div className="extra-tokens-list">
        {sortedCollectibles.map((token) => (token.assets || []).map((asset) => (
          <Token
            key={token.address}
            token={token}
            asset={asset}
            button={!asset.isHidden ? 
              <HiddenIcon className="extra-token-icon" color="#36c979" onClick={() => hideToken(token, asset.tokenId)} /> :
              <VisibleIcon className="extra-token-icon" color="#f98689" onClick={() => unhideToken(token, asset.tokenId)} />
            }
            handleUri={handleUri}
          />
        )))}
      </div>

      <div className="modalBottom">
        <Button clear icon={<MdOutlineClose />} onClick={handleHideModal}>
          Close
        </Button>
      </div>
    </Modal>
  )
}

export default HideCollectibleModal
