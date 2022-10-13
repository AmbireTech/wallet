import { ResetPasswordModal } from "components/Modals"
import OtpTwoFADisableModal from "components/Modals/OtpTwoFADisableModal/OtpTwoFADisableModal"
import OtpTwoFAModal from "components/Modals/OtpTwoFAModal/OtpTwoFAModal"
import { useModals } from "hooks"
import { useToasts } from "hooks/toasts"
import Signer from "./Signer/Signer"
import { useHistory } from 'react-router-dom'
import privilegesOptions from 'ambire-common/src/constants/privilegesOptions'
import { Interface } from "ethers/lib/utils"

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Signers = ({
  relayerURL,
  signers,
  relayerData,
  onAddAccount,
  isLoading,
  setCacheBreak,
  selectedAcc,
  selectedNetwork,
  addRequest,
  showSendTxns,
  hasPendingReset
}) => {
  const { showModal } = useModals()
  const { addToast } = useToasts()
  const history = useHistory()

  const showResetPasswordModal = () => {
    if (!relayerURL) {
      addToast('Unsupported without a connection to the relayer', { error: true })
      return
    }
    showModal(<ResetPasswordModal
      account={selectedAcc}
      selectedNetwork={selectedNetwork}
      relayerURL={relayerURL}
      onAddAccount={onAddAccount}
      showSendTxns={showSendTxns}
    />)
  }

  const handleEnableOtp = () => {
    if (!relayerURL) {
      return addToast('Unsupported without a connection to the relayer', { error: true })
    }

    showModal(<OtpTwoFAModal
      relayerURL={relayerURL} 
      selectedAcc={selectedAcc} 
      setCacheBreak={() => { setCacheBreak(Date.now()) }} 
      />)
  }

  const handleDisableOtp = async() => {
    if (!relayerURL) {
      return addToast('Unsupported without a connection to the relayer', { error: true })
    }
    
    showModal(<OtpTwoFADisableModal
      relayerURL={relayerURL} 
      selectedAcc={selectedAcc} 
      setCacheBreak={() => { setCacheBreak(Date.now()) }} 
      />)
  }

  const onRemoveBtnClicked = key => {
    const txn = craftTransaction(key, privilegesOptions.false)
    addTransactionToAddRequest(txn)
  }

  const onAddBtnClickedHandler = newSignerAddress => {
    const txn = craftTransaction(
      newSignerAddress.address,
      privilegesOptions.true
    )
    addTransactionToAddRequest(txn)
  }

  const onMakeDefaultBtnClicked = async (account, address, isQuickAccount) => {
    if (isQuickAccount) {
      return addToast((<span>To make this signer default, please <a href='#/email-login'>please login with the email</a></span>), {url: '/#/email-login', error: true})
    } else {
      onAddAccount({ ...account, signer: { address: address }, signerExtra: null })
      addToast(
        'This signer is now the default. If it is a hardware wallet, you will have to re-add the account manually to connect it directly, otherwise you will have to add this signer address to your web3 wallet.',
        { timeout: 30000 }
      )
    }

    history.push('/wallet/security')
  }

  const craftTransaction = (address, privLevel) => {
    return {
      to: selectedAcc,
      data: IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
        address,
        privLevel,
      ]),
      value: '0x00',
    }
  }

  const addTransactionToAddRequest = txn => {
    try {
      addRequest({
        id: `setPriv_${txn.data}`,
        type: 'eth_sendTransaction',
        txn: txn,
        chainId: selectedNetwork.chainId,
        account: selectedAcc,
      })
    } catch (err) {
      console.error(err)
      addToast(`Error: ${err.message || err}`, { error: true })
    }
  }
  
  return signers.map(([addr, privValue]) => (
    <Signer
      addr={addr}
      privValue={privValue}
      selectedAccount={selectedAcc}
      hasPendingReset={hasPendingReset}
      relayerData={relayerData}
      handleDisableOtp={handleDisableOtp}
      handleEnableOtp={handleEnableOtp}
      onMakeDefaultBtnClicked={onMakeDefaultBtnClicked}
      showResetPasswordModal={showResetPasswordModal}
    />
  ))
}

export default Signers