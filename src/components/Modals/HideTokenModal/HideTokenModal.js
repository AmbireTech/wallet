import './HideTokenModal.scss'

import { isValidAddress } from 'ambire-common/src/services/address'
import { Button, Loading, Modal, TextInput } from 'components/common'
import { useState } from 'react'
import { MdVisibilityOff, MdOutlineClose, MdOutlineRemove } from 'react-icons/md'
import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'

const ADDRESS_LENGTH = 42
const TOKEN_SYMBOL_MIN_LENGTH = 3

const HideTokenModel = ({ network, account, portfolio }) => {
    const { hideModal } = useModals()
    const { addToast } = useToasts()
    const { hiddenTokens, onAddHiddenToken, onRemoveHiddenToken, tokens } = portfolio
    const [loading, setLoading] = useState(false)
    const [tokenDetails, setTokenDetails] = useState(null)
    const [showError, setShowError] = useState(false)

    const disabled = !tokenDetails

    const onInput = addressOrSymbol => {
        setTokenDetails(null)
        setLoading(true)
        setShowError(false)

        if (addressOrSymbol.length === ADDRESS_LENGTH && !isValidAddress(addressOrSymbol)) addToast(`Invalid address: ${addressOrSymbol}`, {error: true})
        const foundByAddressOrSymbol = tokens.find(i => (i.symbol.toLowerCase() === addressOrSymbol.toLowerCase()) ||
            (i.address.toLowerCase() === addressOrSymbol.toLowerCase()))

        if (!!foundByAddressOrSymbol) setTokenDetails(foundByAddressOrSymbol)
        else if (addressOrSymbol.length >= TOKEN_SYMBOL_MIN_LENGTH) setShowError(true) 
 
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

    return (
        <Modal id="hide-token-modal" title="Hide Token" buttons={buttons}>
            <TextInput
                label="Token Address or Symbol"
                placeholder="Input token address or symbol"
                onInput={value => onInput(value)}
            />
            {showError && 
                (<div className="validation-error">The address/symbol you entered does not appear to correspond to you assets list or it's already hidden.</div>)
            }
            {
                loading ?
                    <Loading/>
                    :
                        !showError && tokenDetails ? 
                            <div className="token-details">
                                <div className="info">
                                    <div className="icon" style={{backgroundImage: `url(${tokenDetails.tokenImageUrl})`}}/>
                                    <div className="name"><span>{tokenDetails.symbol} ({tokenDetails.network.toUpperCase()})</span>
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
                    hiddenTokens.map(({ address, symbol, tokenImageUrl, network }) => (
                        <div className="extra-token" key={address}>
                            <div className="info">
                                <div className="icon" style={{ backgroundImage: `url(${tokenImageUrl})` }}/>
                                <div className="name"><span>{ symbol } ({network.toUpperCase()})</span></div>
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