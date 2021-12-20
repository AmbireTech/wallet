import './AddTokenModal.scss'

import { Contract, getDefaultProvider } from 'ethers';
import { formatUnits, Interface } from 'ethers/lib/utils';
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import { isValidAddress } from '../../../helpers/address';
import { Button, Loading, Modal, TextInput } from '../../common'
import { useState } from 'react';
import { useToasts } from '../../../hooks/toasts';
import { MdOutlineAdd, MdOutlineClose } from 'react-icons/md';

const ERC20Interface = new Interface(ERC20ABI)

const AddTokenModal = ({ network, account, onAddToken }) => {
    const { addToast } = useToasts()

    const [loading, setLoading] = useState(false)
    const [tokenDetails, setTokenDetails] = useState(null)

    const disabled = !tokenDetails || !(tokenDetails.symbol && tokenDetails.decimals)

    const onInput = async address => {
        setTokenDetails(null)

        if (!isValidAddress(address)) return
        setLoading(true)

        try {
            const provider = getDefaultProvider(network.rpc)
            const tokenContract = new Contract(address, ERC20Interface, provider)
            
            const [balanceOf, name, symbol, decimals] = await Promise.all([
                tokenContract.balanceOf(account),
                tokenContract.name(),
                tokenContract.symbol(),
                tokenContract.decimals()
            ])

            const balance = formatUnits(balanceOf, decimals)
            setTokenDetails({
                address,
                balance,
                icon: `https://storage.googleapis.com/zapper-fi-assets/tokens/${network.id}/${address}.png`,
                name,
                symbol,
                decimals
            })
        } catch(e) {
            console.error(e)
            addToast('Failed to load token details: ' + e.message || e, { error: true })
        }

        setLoading(false)
    }

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>}>Close</Button>
        <Button icon={<MdOutlineAdd/>} disabled={disabled} onClick={() => onAddToken(tokenDetails)}>Add</Button>
    </>

    return (
        <Modal id="add-token-modal" title="Add Token" buttons={buttons}>
            <TextInput
                label="Token Address"
                placeholder="0x..."
                onInput={value => onInput(value)}
            />
            {
                loading ?
                    <Loading/>
                    :
                        tokenDetails ? 
                            <div className="details">
                                <div className="heading">
                                    <div className="icon" style={{backgroundImage: `url(${tokenDetails.icon})`}}/>
                                    <div className="title">{ tokenDetails.name } ({ tokenDetails.symbol })</div>
                                </div>
                                <div className="balance">
                                    Balance: <span>{ tokenDetails.balance }</span> <b>{ tokenDetails.symbol }</b>
                                </div>
                            </div>
                            :
                            null
            }
        </Modal>
    )
}

export default AddTokenModal