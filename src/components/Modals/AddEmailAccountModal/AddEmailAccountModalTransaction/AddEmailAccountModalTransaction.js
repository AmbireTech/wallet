import { useCallback, useEffect } from 'react'
import { Button } from 'components/common'
import { MdCompareArrows } from 'react-icons/md'
import { createQuickaccPrivilegeUpdateBundle } from 'lib/quickaccUtils'

const AddEmailAccountModalTransaction = ({
  hideModal,
  selectedAcc,
  selectedNetwork,
  identityData,
  setModalButtons,
  showSendTxns
}) => {

  const finalizeQuickAccPrivilegeOnChain = useCallback(async () => {

    const bundle = createQuickaccPrivilegeUpdateBundle(
      {
        accountAddress: selectedAcc.id,
        networkId: selectedNetwork.id,
        currentSigner: selectedAcc.signer,
        newQuickAccSigner: identityData.meta.quickAccSigner,
      }
    )

    showSendTxns(bundle, true)
    hideModal()
  }, [identityData, selectedNetwork, selectedAcc, showSendTxns, hideModal])

  useEffect(() => {
    setModalButtons(<Button className={'full'} onClick={finalizeQuickAccPrivilegeOnChain}>Finalize</Button>)
  }, [setModalButtons, finalizeQuickAccPrivilegeOnChain])

  return (
    <>
      <div className={'info-panel instructions-message mb-4'}>
        <MdCompareArrows size={64}/>
        <div>
          To finalize the account change on <b>{selectedNetwork.id}</b>, a transaction has to be sent on-chain.
        </div>
      </div>

      <div className={'info-panel instructions-message mb-4 instructions-message-small'}>
        Note: If you are switching to other networks, you will be prompted to send this transaction as well in the
        security page.
      </div>
    </>
  )
}

export default AddEmailAccountModalTransaction
