import './HideTokenModal.scss'

import { isValidAddress } from 'lib/address'
import { Button, Loading, Modal, TextInput } from 'components/common'
import { useState } from 'react'
import { useToasts } from 'hooks/toasts'
import { MdVisibilityOff, MdOutlineClose, MdOutlineRemove } from 'react-icons/md'
import { useModals } from 'hooks'

const HideTokenModel = ({ network, account, portfolio }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const { hiddenTokens, onAddHiddenToken, onRemoveHiddenToken, tokens } = portfolio

    const [loading, setLoading] = useState(false)
    const [tokenDetails, setTokenDetails] = useState(null)
    const [showError, setShowError] = useState(false)

    const disabled = !tokenDetails || !(tokenDetails.symbol && tokenDetails.decimals)

    const onInput = async addressOrName => {
        setTokenDetails(null)
        setLoading(true)
        setShowError(false)
        
        if (!isValidAddress(addressOrName)) {
            const test = tokens.filter(i => i.symbol.toLowerCase() === addressOrName.toLowerCase())
            
            if (test !== -1) setTokenDetails(test[0])
        } else {
            const test = tokens.filter(i => i.address.toLowerCase() === addressOrName.toLowerCase())
            
            if (test !== -1) setTokenDetails(test[0])
        }
        
        setLoading(false)
    }

    const addToken = () => {
        onAddHiddenToken(tokenDetails)
        hideModal()
    }

    const removeToken = address => {
        onRemoveHiddenToken(address)
        hideModal()
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button icon={<MdVisibilityOff/>} disabled={disabled} onClick={addToken}>Hide</Button>
    </>
    const tokenStandard = network.id === 'binance-smart-chain' ? 'a BEP20' : (
        network.id === 'ethereum'
            ? 'an ERC20'
            : 'a valid'
    )

    return (
        <Modal id="hide-token-modal" title="Hide Token" buttons={buttons}>
            <TextInput
                label="Token Address/Name"
                placeholder="Input token address or name"
                onInput={value => onInput(value)}
            />
            {
                showError ? 
                    <div className="validation-error">
                        The address you entered does not appear to correspond to {tokenStandard} token on { network.name }.
                    </div>
                    :
                    null
            }
            {
                loading ?
                    <Loading/>
                    :
                        !showError && tokenDetails ? 
                            <div className="token-details">
                                <div className="info">
                                    <div className="icon" style={{backgroundImage: `url(${tokenDetails.icon})`}}/>
                                    <div className="name">
                                        { tokenDetails.name } <span>({ tokenDetails.symbol })</span>
                                    </div>
                                </div>
                                <div className="balance">
                                    Balance: <span>{ tokenDetails.balance }</span> <b>{ tokenDetails.symbol }</b>
                                </div>
                            </div>
                            :
                            null
            }
            <div className="extra-tokens-list">
                {
                    hiddenTokens.map(({ address, symbol, tokenImageUrl }) => (
                        <div className="extra-token" key={address}>
                            <div className="info">
                                <div className="icon" style={{ backgroundImage: `url(${tokenImageUrl})` }}/>
                                <div className="name"><span>{ symbol }</span></div>
                            </div>
                            <div className="actions">
                                <Button mini clear onClick={() => removeToken(address)}>
                                    <MdOutlineRemove/>
                                </Button>
                            </div>
                        </div>
                    ))
                }
            </div>
        </Modal>
    )
}

export default HideTokenModel