import { useState, useCallback, useEffect } from 'react'
import { TextInput, PasswordInput, Loading, Button } from 'components/common'
import { fetchPost } from 'lib/fetch'
import { id } from 'ethers/lib/utils'
import { Wallet } from 'ethers'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { getWallet } from 'lib/getWallet'
import { FaLink } from 'react-icons/fa'
import { MdCheck, MdClose } from 'react-icons/md'

const AddEmailAccountModalForm = ({
  relayerURL,
  setModalButtons,
  hideModal,
  setError,
  setEmail,
  setStepIndex,
  selectedAcc,
  selectedNetwork
}) => {

  const [isSigning, setIsSigning] = useState(false)

  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordConfirmInput, setPasswordConfirmInput] = useState('')

  const onConfirm = useCallback(async () => {

    setError(null)

    // same email verification as in relayer codebase
    const host = emailInput.split('@')[1]
    // TODO : shouldn't we use permissive regex instead?
    if (
      !host
      || !host.includes('.')
      || !host.split('.')[1].length
    ) return setError('Invalid email')

    if (passwordInput <= 8) return setError('Password should be 8 characters minimum')

    if (passwordConfirmInput !== passwordInput) return setError('The passwords do not match.')

    // create signer locally
    const extraEntropy = id(emailInput + ':' + Date.now() + ':' + Math.random() + ':' + (typeof performance === 'object' && performance.now()))
    const firstKeyWallet = Wallet.createRandom({ extraEntropy })
    const secondKeySecret = Wallet.createRandom({ extraEntropy }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + emailInput

    const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret }).catch(err => {
      throw new Error(`Could not request second-key`)
    })
    if (!secondKeyResp.address) throw new Error(`second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`)

    const { quickAccManager, quickAccTimelock } = accountPresets
    const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
    const signer = {
      quickAccManager,
      timelock: quickAccountTuple[0],
      one: quickAccountTuple[1],
      two: quickAccountTuple[2],
    }

    const encryptedFirstKeyBackup = await firstKeyWallet.encrypt(passwordInput, accountPresets.encryptionOpts)
    const primaryKeyBackup = JSON.stringify(encryptedFirstKeyBackup)

    const wallet = getWallet({
      signer: selectedAcc.signer,
      signerExtra: selectedAcc.signerExtra,
      chainId: selectedNetwork.id
    })

    const signerData = {
      email: emailInput,
      signer,
      primaryKeyBackup,
      secondKeySecret,
    }

    setIsSigning(true)
    const sig = await wallet.signMessage(JSON.stringify(signerData))
      .catch((err) => {
        setError('Signature denied :' + err.message)
      })
    setIsSigning(false)
    if (!sig) return

    const emailExistsResult = await fetchPost(`${relayerURL}/identity/${selectedAcc.id}/link-email`, {
      signerData,
      sig
    })

    if (!emailExistsResult.success) {
      return setError(emailExistsResult.message)
    }

    setEmail(emailInput)
    setStepIndex(1)

  }, [emailInput, passwordConfirmInput, passwordInput, relayerURL, selectedAcc, selectedNetwork, setEmail, setError, setStepIndex])

  useEffect(() => {
    setModalButtons(<>
      <Button clear small icon={<MdClose/>} onClick={hideModal}>Cancel</Button>
      <Button small icon={<MdCheck/>} onClick={onConfirm}>Sign and Confirm</Button>
    </>)
  }, [hideModal, onConfirm, setModalButtons])

  return (
    <>
      <div className={'info-panel instructions-message mb-4'}>
        <FaLink/>
        Associate your Ambire Wallet account with an email and password combination
      </div>
      {
        isSigning
          ? (
            <>
              <Loading/>
            </>
          )
          : (
            <>
              <div className={'email-modal-inputs'}>
                <TextInput key='email' onChange={setEmailInput} value={emailInput} label='Email account'
                           placeholder='Email'/>
                <PasswordInput key='password' onChange={setPasswordInput} value={passwordInput} label='Password'
                               placeholder='Password'/>
                <PasswordInput key='passwordConfirm' onChange={setPasswordConfirmInput} value={passwordConfirmInput}
                               label='Confirm Password'
                               placeholder='Confirm Password'/>
              </div>
            </>
          )
      }
    </>
  )
}

export default AddEmailAccountModalForm
