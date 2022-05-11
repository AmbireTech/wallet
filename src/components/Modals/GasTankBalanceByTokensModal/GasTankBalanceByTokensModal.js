import './GasTankBalanceByTokensModal.scss'

import { Button, Loading, Modal } from 'components/common'
import { useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { useModals } from 'hooks'
import { getTokenIcon } from 'lib/icons'

const GasTankBalanceByTokensModal = ({ network, account, portfolio, data }) => {
    const { hideModal } = useModals()
    console.log('data', data)
    // const { extraTokens, onAddExtraToken, onRemoveExtraToken } = portfolio

    const [loading, setLoading] = useState(false)
    const [showError, setShowError] = useState(false)

    const buttons = <>
        <Button clear icon={<MdOutlineClose/>} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="gas-tank-balance-by-tokens-modal" title="Gas Tank Balance By Tokens" buttons={buttons}>
           <div className='content'>
                {
                    data && data.map((item, key) => {
                            return (
                                <div key={key}>
                                    {/* TODO: Add a tokens logo here */}
                                    <span>{item.symbol}</span>
                                    <span>{item.balance}</span>
                                    <span>${item.balanceInUSD.toFixed(2)}</span>
                                </div>
                            )
                    })
                }
           </div>
        </Modal>
    )
}

export default GasTankBalanceByTokensModal