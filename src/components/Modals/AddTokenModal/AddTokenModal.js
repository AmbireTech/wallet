import './AddTokenModal.scss'

import { Contract } from 'ethers';
import { formatUnits, Interface } from 'ethers/lib/utils';
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import { isValidAddress } from 'ambire-common/src/services/address';
import { Button, Loading, Modal, TextInput } from 'components/common'
import { useState } from 'react';
import { useToasts } from 'hooks/toasts';
import { MdOutlineAdd, MdOutlineClose, MdOutlineRemove } from 'react-icons/md';
import { useModals } from 'hooks';
import { getProvider } from 'ambire-common/src/services/provider'
import { getTokenIcon } from 'lib/icons'

const ERC20Interface = new Interface(ERC20ABI)

const AddTokenModal = ({ network, account, portfolio }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const { extraTokens, onAddExtraToken, onRemoveExtraToken } = portfolio

    const [loading, setLoading] = useState(false)
    const [tokenDetails, setTokenDetails] = useState(null)
    const [showError, setShowError] = useState(false)

    const disabled = !tokenDetails || !(tokenDetails.symbol && tokenDetails.decimals)

    const onInput = async address => {
        setTokenDetails(null)

        if (!isValidAddress(address)) return 
        setLoading(true)
        setShowError(false)

        try {
            const provider = getProvider(network.id)
            const tokenContract = new Contract(address, ERC20Interface, provider)
            
            const [balanceOf, name, symbol, decimals] = await Promise.all([
                tokenContract.balanceOf(account),
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals()
            ])

            const balance = formatUnits(balanceOf, decimals)
            setTokenDetails({
                account,
                address: address.toLowerCase(),
                network: network.id,
                balance,
                balanceRaw: balanceOf.toString(),
                tokenImageUrl: getTokenIcon(network.id, address),
                name,
                symbol,
                decimals
            })
        } catch(e) {
            console.error(e)
            addToast('Failed to load token info', { error: true })
            setShowError(true)
        }

        setLoading(false)
    }

    const addToken = () => {
        onAddExtraToken(tokenDetails)
        hideModal()
    }

    const removeToken = address => {
        onRemoveExtraToken(address)
        hideModal()
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
        <Button icon={<MdOutlineAdd/>} disabled={disabled} onClick={addToken}>Add</Button>
    </>
    const tokenStandard = network.id === 'binance-smart-chain' ? 'a BEP20' : (
        network.id === 'ethereum'
            ? 'an ERC20'
            : 'a valid'
    )

    return (
        <Modal id="add-token-modal" title="Add Token" buttons={buttons}>
            <TextInput
                label="Token Address"
                placeholder="0x..."
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
                                        { tokenDetails.name } <span>({ tokenDetails.symbol }) {tokenDetails.network.toUpperCase()}</span>
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
                    extraTokens.map(({ address, name, symbol, tokenImageUrl, network }) => (
                        <div className="extra-token" key={address}>
                            <div className="info">
                                <div className="icon" style={{ backgroundImage: `url(${tokenImageUrl})` }}/>
                                <div className="name">{ name } <span>({ symbol }) {network.toUpperCase()}</span></div>
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

export default AddTokenModal
