import './HideTokenModal.scss'

import { Button, Modal } from 'components/common'
import {
  MdOutlineClose,
  MdVisibilityOff as VisibleIcon,
  MdRemoveRedEye as HiddenIcon
} from 'react-icons/md'
import { useModals } from 'hooks'
import { useEffect, useMemo } from 'react'

const Token = ({ token, button }) => (
  <div className="extra-token" key={token.address}>
    <div className="info">
      <div className="icon" style={{ backgroundImage: `url(${token.tokenImageUrl})` }} />
      <div className="name">
        <span>
          {token.symbol} ({token.network.toUpperCase()})
        </span>
      </div>
    </div>
    {button}
  </div>
)

const HideTokenModel = ({ portfolio, account, network, userSorting, sortType, setIsHideTokenModalOpen }) => {
  const { hideModal, setOnClose } = useModals()
  const { hiddenTokens, onAddHiddenToken, onRemoveHiddenToken, tokens } = portfolio

  const hideToken = (token) => onAddHiddenToken(token)

  const unhideToken = (token) => onRemoveHiddenToken(token.address)

  const sortedTokens = useMemo(() => {
    const tempTokens = tokens.concat(hiddenTokens).sort((a, b) => {
      if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
        const sorted = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address) - userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address)
        return sorted
      } else {
        const decreasing = b.balanceUSD - a.balanceUSD
        if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
        return decreasing
      }
    })

    return [...new Map(tempTokens.map(token => [token.address, token])).values()]
  }, [tokens, hiddenTokens, userSorting, sortType, account, network.chainId])

  const handleHideModal = () => {
    setIsHideTokenModalOpen(false)
    hideModal()
  }

  useEffect(() => {
    setOnClose({close: () => setIsHideTokenModalOpen(false)})
  }, [setOnClose, setIsHideTokenModalOpen])

  return (
    <Modal id="hide-token-modal" title="Hide Token" isCloseBtnShown={false}>
      <div className="extra-tokens-list">
        {sortedTokens.map((token) => (
          <Token
            key={token.address}
            token={token}
            button={!token.isHidden ? 
              <HiddenIcon className="extra-token-icon" color="#36c979" onClick={() => hideToken(token)} /> :
              <VisibleIcon className="extra-token-icon" color="#f98689" onClick={() => unhideToken(token)} />
            }
          />
        ))}
      </div>

      <div className="modalBottom">
        <Button clear icon={<MdOutlineClose />} onClick={handleHideModal} className='buttonComponent'>
          Close
        </Button>
      </div>
    </Modal>
  )
}

export default HideTokenModel
