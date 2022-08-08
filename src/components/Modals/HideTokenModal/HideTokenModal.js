import './HideTokenModal.scss'

import { Button, Modal } from 'components/common'
import {
  MdOutlineClose,
  MdVisibilityOff as VisibleIcon,
  MdRemoveRedEye as HiddenIcon
} from 'react-icons/md'
import { useModals } from 'hooks'

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
    <div className="actions">{button}</div>
  </div>
)

const HideTokenModel = ({ portfolio }) => {
  const { hideModal } = useModals()
  const { hiddenTokens, onAddHiddenToken, onRemoveHiddenToken, tokens } = portfolio

  const hideToken = (token) => {
    onAddHiddenToken(token)
    hideModal()
  }

  const unhideToken = (token) => {
    onRemoveHiddenToken(token.address)
    hideModal()
  }

  return (
    <Modal id="hide-token-modal" title="Hide Token">
      <div className="extra-tokens-list">
        {tokens.map((token) => (
          <Token
            key={token.address}
            token={token}
            button={
              <Button mini clear onClick={() => hideToken(token)}>
                <HiddenIcon />
              </Button>
            }
          />
        ))}
        {hiddenTokens.map((token) => (
          <Token
            key={token.address}
            token={token}
            button={
              <Button mini clear onClick={() => unhideToken(token)}>
                <VisibleIcon />
              </Button>
            }
          />
        ))}
      </div>
      <div className="modalBottom">
        <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>
          Close
        </Button>
      </div>
    </Modal>
  )
}

export default HideTokenModel
