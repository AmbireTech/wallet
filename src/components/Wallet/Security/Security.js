import './Security.scss'

import { RiDragDropLine } from 'react-icons/ri'
import { useState, useEffect, useCallback } from 'react'
import { Loading, DropDown } from 'components/common'
import { Interface, AbiCoder, keccak256 } from 'ethers/lib/utils'
import accountPresets from 'consts/accountPresets'
import privilegesOptions from 'consts/privilegesOptions'
import { useRelayerData, useModals } from 'hooks'
import { ResetPasswordModal } from 'components/Modals'
import AddAuthSigner from './AddAuthSigner/AddAuthSigner'
import { useToasts } from 'hooks/toasts'
import { useHistory } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { MdInfoOutline, MdOutlinePassword } from 'react-icons/md'
import { validateImportedAccountProps, fileSizeValidator } from 'lib/validations/importedAccountValidations'
import OtpTwoFAModal from 'components/Modals/OtpTwoFAModal/OtpTwoFAModal'
import OtpTwoFADisableModal from 'components/Modals/OtpTwoFADisableModal/OtpTwoFADisableModal'
import Backup from './Backup/Backup'
import PendingRecoveryNotice from './PendingRecoveryNotice/PendingRecoveryNotice'
import { getName } from 'lib/humanReadableTransactions'
import * as blockies from 'blockies-ts'
import { FaCog, FaTimes } from 'react-icons/fa'
import { FiShield, FiShieldOff } from 'react-icons/fi'
import { MdFactCheck, MdOutlineLockOpen } from 'react-icons/md'


const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const REFRESH_INTVL = 40000

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addRequest,
  showSendTxns,
  onAddAccount
}) => {
  const { showModal } = useModals()
  const [ cacheBreak, setCacheBreak ] = useState(() => Date.now())
  
  useEffect(() => {
    if (Date.now() - cacheBreak > 30000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), REFRESH_INTVL)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData(url)
  const privileges = data ? data.privileges : {}
  const otpEnabled = data ? data.otpEnabled : null
  const recoveryLock = data && data.recoveryLock
  const { addToast } = useToasts()
  const history = useHistory()
  const selectedAccount = accounts.find(x => x.id === selectedAcc)

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

  const showResetPasswordModal = () => {
    if (!relayerURL) {
      addToast('Unsupported without a connection to the relayer', { error: true })
      return
    }
    showModal(<ResetPasswordModal
      account={selectedAccount}
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
      selectedAcc={selectedAccount} 
      setCacheBreak={() => { setCacheBreak(Date.now()) }} 
      />)
  }

  const handleDisableOtp = async() => {
    if (!relayerURL) {
      return addToast('Unsupported without a connection to the relayer', { error: true })
    }
    
    showModal(<OtpTwoFADisableModal 
      relayerURL={relayerURL} 
      selectedAcc={selectedAccount} 
      setCacheBreak={() => { setCacheBreak(Date.now()) }} 
      />)
  }
  
  // JSON import
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const reader = new FileReader()
    
    if (rejectedFiles.length) {
      addToast(`${rejectedFiles[0].file.path} - ${(rejectedFiles[0].file.size / 1024).toFixed(2)} KB. ${rejectedFiles[0].errors[0].message}`, { error: true })
    }

    if (acceptedFiles.length){
      const file = acceptedFiles[0]

      reader.readAsText(file,'UTF-8')
      reader.onload = readerEvent => {
        const content = readerEvent.target.result
        const fileContent = JSON.parse(content)
        const validatedFile = validateImportedAccountProps(fileContent)
        
        if (validatedFile.success) onAddAccount(fileContent, { select: true })
        else addToast(validatedFile.message, { error: true})
      }
    }
  }, [addToast, onAddAccount])
  const { getRootProps, getInputProps, open, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: 'application/json',
    maxFiles: 1,
    validator: fileSizeValidator
  })

  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook/service
  // and aggregate from that
  const accHash = signer => {
      const abiCoder = new AbiCoder()
      const { timelock, one, two } = signer
      return keccak256(abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]]))
  }
  const hasPendingReset = privileges[selectedAccount.signer.quickAccManager] && (
    (recoveryLock && recoveryLock.status && !isLoading)
      || (
          privileges && selectedAccount.signer.quickAccManager
          // is or has been in recovery state
          && selectedAccount.signer.preRecovery
          // but that's not finalized yet
          && accHash(selectedAccount.signer) !== privileges[selectedAccount.signer.quickAccManager]
      )
    )

  const privList = Object.entries(privileges)
    // Avoid random position jumping
    .sort((a, b) => {

      const [addr_A] = a
      const [addr_B] = b

      const isQuickAcc_A = addr_A === accountPresets.quickAccManager
      const signerAddress_A = isQuickAcc_A
        ? selectedAccount.signer.quickAccManager
        : selectedAccount.signer.address

      const isQuickAcc_B = addr_B === accountPresets.quickAccManager
      const signerAddress_B = isQuickAcc_B
        ? selectedAccount.signer.quickAccManager
        : selectedAccount.signer.address

      const isSelected_A = signerAddress_A === addr_A
      const isSelected_B = signerAddress_B === addr_B

      if (isSelected_A && isSelected_B){
        return addr_A.localeCompare(addr_B)
      } else {
        if (isSelected_A) return -1
        if (isSelected_B) return 1
      }

      return addr_A.localeCompare(addr_B)

    })
    .map(([addr, privValue]) => {
      if (!privValue) return null
  
      const addressName = getName(addr) || null
      const isQuickAcc = addr === accountPresets.quickAccManager

      const relevantAddr = isQuickAcc ? (selectedAccount.signer.one) : addr

      const signerType = isQuickAcc
        ? `Email/password signer (${selectedAccount.email || 'unknown email'})`
        : `Regular signer ${addressName && addressName !== addr ? `(${addressName})` : ''}`

      const signerAddress = isQuickAcc
        ? selectedAccount.signer.quickAccManager
        : selectedAccount.signer.address
      const isSelected = signerAddress === addr
      const canChangePassword = isQuickAcc && !hasPendingReset

      const accountIcon = blockies.create({ seed: relevantAddr }).toDataURL()

      return (
        <li key={addr} className='privList-item'>
          <div className='autorizedSigner'>
            <div className='signerBlockies'>
              <div className="icon" style={relevantAddr ? {backgroundImage: `url(${accountIcon})`} : null}></div>
            </div>
            <div className='signerAddress'>
              <span className='signerAddress-type' >
                {signerType}
              </span>
              <span className='signerAddress-address' >
                {relevantAddr || (isQuickAcc ? 'Address displayable only as defaut signer' : '')}
              </span>
            </div>
            <div className='signer-indications'>
              {
                (isQuickAcc && !otpEnabled)  &&
                <span className='2fa-signer-indication'>
                  <MdOutlineLockOpen /> 2FA disabled
                </span>
              }
              {
                isSelected &&
                <span className='main-signer-indication'>
                  <MdFactCheck /> Default signer
                </span>
              }
            </div>
          </div>
          <div className="btns-wrapper">
            <DropDown
              className='dropdown-signer-actions'
              style={{ height: '60px' }}
              title={<FaCog />}
              closeOnClick
              displayChevron={false}
            >
              <ul className="signer-actions">
                {isQuickAcc && (otpEnabled !== null) && (otpEnabled ?
                    (<li onClick={handleDisableOtp} className='danger'>
                      <span>
                        <FiShieldOff />
                      </span>
                      Disable 2FA
                    </li>) :
                    (<li onClick={handleEnableOtp} >
                      <span>
                        <FiShield />
                      </span>
                       Enable 2FA
                    </li>)
                )}
                {isQuickAcc && (<li
                    className={!canChangePassword ? 'disabled' : ''}
                    onClick={showResetPasswordModal} >
                    <span>
                      <MdOutlinePassword />
                    </span>
                    {
                      canChangePassword
                        ? 'Change password'
                        : 'Password recovery in progress'
                    }
                </li>
                )}
                {
                  !isSelected &&
                    <li
                      onClick={() =>
                        onMakeDefaultBtnClicked(selectedAccount, addr, isQuickAcc)
                      }
                    >
                      <span>
                        <MdFactCheck />
                      </span>
                      Set as default signer
                    </li>
                }
                <li
                  className={`danger${isSelected ? ' disabled' : ''}`}
                  onClick={() => {
                    if (!isSelected) {
                      onRemoveBtnClicked(addr)
                    }
                  }}
                >
                  {
                    isSelected
                    ?
                      <>
                        <span>
                          <FaTimes />
                        </span>
                        Can't Revoke default signer
                      </>
                      :
                      <>
                        <span>
                          <FaTimes />
                        </span>
                        Revoke signer
                      </>
                  }
                </li>
              </ul>
            </DropDown>
          </div>
        </li>
      )
    })
    .filter(x => x)

  const showLoading = isLoading && !data
  const signersFragment = relayerURL ? (<>
    <div className="panel" id="signers">
      {hasPendingReset && !showLoading && (<PendingRecoveryNotice
        recoveryLock={recoveryLock}
        showSendTxns={showSendTxns}
        selectedAccount={selectedAccount}
        selectedNetwork={selectedNetwork}
      />)}
      <div className='network-warning'>
        <MdInfoOutline size={36}></MdInfoOutline>
        <div>
          Please note: signer settings are network-specific. You are currently looking at and modifying the signers on {selectedNetwork.name}.
          &nbsp;<a href='https://help.ambire.com/hc/en-us/articles/4410885684242-Signers' target='_blank' rel='noreferrer'>Need help? Click here.</a>
        </div>
      </div>
      <div className="panel-title">Authorized signers</div>
      {errMsg && (
        <h3 className="error">Error getting authorized signers: {errMsg}</h3>
      )}
      {showLoading && <Loading />}
      <ul className="content privList">{!showLoading && privList}</ul>
    </div>
    <div className="panel">
      <div className="panel-title">Add new signer</div>
      <AddAuthSigner
        onAddBtnClicked={onAddBtnClickedHandler}
        selectedNetwork={selectedNetwork}
        selectedAcc={selectedAccount}
      />
    </div>
  </>) : (
    <div className="panel">
      <div className="panel-title">Authorized signers</div>
      <h3 className="error">
        Unsupported: not connected to a relayer.
      </h3>
    </div>
  )
  return (
    <section id="security" className={(isDragActive ? 'activeStyle ' : '') + (isDragAccept ? 'acceptStyle ' : '') + (isDragReject ? 'rejectStyle ' : '')} {...getRootProps()}>
      {
        (isDragAccept || isDragReject)
        && (<div className={isDragAccept ? 'acceptStyleIcon' : 'rejectStyleIcon'}><RiDragDropLine size={100}/></div>)
      }
      
      <input {...getInputProps()} />
      {signersFragment}

      <Backup 
        selectedAccount={selectedAccount}
        onOpen={open}
        onAddAccount={onAddAccount}
      />
    </section>
  )
}

export default Security
