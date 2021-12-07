import './WalletTokenModal.scss'

import { Button, Modal, TextInput } from '../../common'
import { MdOutlineClose } from 'react-icons/md'

const WalletTokenModal = () => {
    return (
        <Modal id="wallet-token-modal" title="$WALLET">
            <TextInput label="Balance" disabled/>
            <div className="separator"></div>
            <div className="title">Claimable</div>
            <TextInput label="Early users Incentive" disabled/>
            <TextInput label="Referral Incentive" disabled/>
            <TextInput label="ADX Staking Bonus" disabled/>
            <TextInput label="Gas Rebates" disabled/>
            <div className="buttons">
                <Button clear icon={<MdOutlineClose/>}>Close</Button>
            </div>
        </Modal>
    )
}

export default WalletTokenModal