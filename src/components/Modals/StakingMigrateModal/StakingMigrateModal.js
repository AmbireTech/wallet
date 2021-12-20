import './StakingMigrateModal.scss'

import { Button, Modal, ToolTip } from '../../common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from '../../../hooks'

const StakingMigrateModal = ({ balances }) => {
    const { hideModal } = useModals()

    const migrateButton = (token) => <>
        <ToolTip label="Migrate current signer balances to Ambire wallet to farm WALLET token">
            <Button small clear disabled>Migrate {token}</Button>
        </ToolTip>
    </>

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>
    
    return (
        <Modal id="adx-staking-migrate-modal" title="ADX-STAKING Migration" buttons={modalButtons}>
            <div className="item">
                <div className="details">
                    <label>ADX-STAKING</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{ balances.find(x=> x.token === 'ADX-STAKING').balance.toString() }</span></div>
                    </div>
                </div>
                <div className="actions">
                    { migrateButton('ADX-STAKING') }
                </div>
            </div>
            <div className="item">
                <div className="details">
                    <label>ADX-LOYALTY</label>
                    <div className="balance">
                        <div className="amount"><span className="primary-accent">{  balances.find(x=> x.token === 'ADX-LOYALTY').balance.toString() }</span></div>
                    </div>
                </div>
                <div className="actions">
                    { migrateButton('ADX-LOYALTY') }
                </div>
            </div>
            <div id="info">
        
            </div>
        </Modal>
    )
}

export default StakingMigrateModal