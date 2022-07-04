import './GasTankBalanceByTokensModal.scss'

import { Button, Modal } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'

const GasTankBalanceByTokensModal = ({ data }) => {
    const { hideModal } = useModals()
    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="gas-tank-balance-by-tokens-modal" title="GAS TANK BALANCE BY TOKENS" buttons={buttons}>
           <div className='content'>
                <div className='row'>
                    <div className='logo'> </div>
                    <div className='item'>
                        <span>Token</span>
                    </div>
                    <div className='balance'>
                        <span>Amount</span>
                    </div>
                    <div className='balance'>
                        <span>Balance</span>
                    </div>
                </div>
                {
                    data && data.map((item, key) => {
                        return (
                            <div className='row' key={key}>
                                {/* //TODO: make the logo to be rounded */}
                                <div className='logo'>
                                    <img width="25px" height='25px' alt='logo' src={getTokenIcon(item.network, item.address)} /> 
                                </div>
                                <div className='item'>
                                    <span>{ item.symbol.toUpperCase() }</span>
                                </div>
                                <div className='balance'>
                                    <span>{ formatFloatTokenAmount(item.balance, true, 6) }</span>
                                </div>
                                <div className='balance'>
                                    <span>$ {formatFloatTokenAmount(item.balanceInUSD, true, 6) }</span>
                                </div>
                            </div>
                        )
                    })
                }
           </div>
        </Modal>
    )
}

export default GasTankBalanceByTokensModal