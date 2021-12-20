import './AddTokenModal.scss'

import { Contract, getDefaultProvider } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import { isValidAddress } from '../../../helpers/address';
import { Modal, TextInput } from '../../common'

const ERC20Interface = new Interface(ERC20ABI)

const AddTokenModal = ({ network }) => {
    const onInput = async address => {
        if (!isValidAddress(address)) return
        console.log(address);

        const provider = getDefaultProvider(network.rpc)
        console.log(provider);
        const tokenContract = new Contract(address, ERC20Interface, provider)
        
        const [symbol, decimals] = await Promise.all([tokenContract.symbol(), tokenContract.decimals()])
        console.log(symbol, decimals);
    }

    return (
        <Modal id="add-token-list" title="Add Token">
            <TextInput
                placeholder="Token address"
                onInput={value => onInput(value)}
            />
            <div className="list">

            </div>
        </Modal>
    )
}

export default AddTokenModal