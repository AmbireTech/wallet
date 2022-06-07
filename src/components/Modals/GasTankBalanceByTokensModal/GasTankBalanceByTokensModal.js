import './GasTankBalanceByTokensModal.scss'

import { Button, Modal } from 'components/common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { getTokenIcon } from 'lib/icons'

const GasTankBalanceByTokensModal = ({ network, data }) => {
    const { hideModal } = useModals()
    console.log('data', data)
    console.log('network', network)
    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="gas-tank-balance-by-tokens-modal" title="Gas Tank Balance By Tokens" buttons={buttons}>
           <div className='content'>
                {
                    data && data.map((item, key) => {
                        return (
                            <div className='row' key={key}>
                                {/* TODO: Add a tokens logo here */}
                                <img width="25px" height='25px' alt='logo' src={getTokenIcon(network, item.address)} />
                                <span>{item.symbol.toUpperCase()}</span>
                                <span>{item.balance}</span>
                                <span>$ {item.balanceInUSD.toFixed(2)}</span>
                            </div>
                        )
                    })
                }
           </div>
        </Modal>
    )
}

export default GasTankBalanceByTokensModal