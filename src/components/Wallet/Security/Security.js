import './Security.scss'

import { MdOutlineAdd, MdOutlineRemove, MdOutlineWarningAmber } from 'react-icons/md'
import { RiDragDropLine } from 'react-icons/ri'
import { BiExport, BiImport } from 'react-icons/bi'
import { useState, useEffect, useCallback } from 'react'
import { Loading, TextInput, Button } from '../../common'
import { Interface, AbiCoder, keccak256 } from 'ethers/lib/utils'
import accountPresets from '../../../consts/accountPresets'
import privilegesOptions from '../../../consts/privilegesOptions'
import { useRelayerData, useModals } from '../../../hooks'
import { InputModal, ResetPasswordModal } from '../../Modals'
import AddressList from '../../common/AddressBook/AddressList/AddressList'
import { isValidAddress } from '../../../helpers/address'
import AddAuthSigner from './AddAuthSigner/AddAuthSigner'
import { useToasts } from '../../../hooks/toasts'
import { useHistory } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { MdInfoOutline } from 'react-icons/md'
import { validateImportedAccountProps, fileSizeValidator } from '../../../lib/validations/importedAccountValidations'
import buildRecoveryBundle from '../../../helpers/recoveryBundle'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const REFRESH_INTVL = 40000

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addressBook,
  addRequest,
  showSendTxns,
  onAddAccount
}) => {
  const { addresses, addAddress, removeAddress } = addressBook

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
  const recoveryLock = data && data.recoveryLock ? data.recoveryLock : null
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
  // Address book
  const modalInputs = [
    { label: 'Name', placeholder: 'My Address' },
    { label: 'Address', placeholder: '0x', validate: value => isValidAddress(value) }
  ]
  const inputModal = <InputModal title="Add New Address" inputs={modalInputs} onClose={([name, address]) => addAddress(name, address)}></InputModal>
  const showInputModal = () => showModal(inputModal)

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
 
  const createRecoveryRequest = async () => {
    const abiCoder = new AbiCoder()
    const { timelock, one, two } = selectedAccount.signer
    const quickAccountTuple = [timelock, one, two]
    const newQuickAccHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
    const bundle = buildRecoveryBundle(selectedAccount.id, selectedNetwork.id, selectedAccount.signer.preRecovery, newQuickAccHash)
    showSendTxns(bundle)
  }

  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook/service
  // and aggregate from that
  const privList = Object.entries(privileges)
    .map(([addr, privValue]) => {
      if (!privValue) return null
      const isQuickAcc = addr === accountPresets.quickAccManager
      const privText = isQuickAcc
        ? `Email/password signer (${selectedAccount.email || 'unknown email'})`
        : addr
      const signerAddress = isQuickAcc
        ? selectedAccount.signer.quickAccManager
        : selectedAccount.signer.address
      const isSelected = signerAddress === addr

      return (
        <li key={addr}>
          <TextInput className="depositAddress" value={privText} disabled />
          <div className="btns-wrapper">
            {isQuickAcc && selectedAccount.primaryKeyBackup && !recoveryLock && (<Button onClick={showResetPasswordModal} small>Change password</Button>)}
            <Button
              disabled={isSelected}
              title={isSelected ? 'Signer is already default' : ''}
              onClick={() =>
                onMakeDefaultBtnClicked(selectedAccount, addr, isQuickAcc)
              }
              small
            >
              Make default
            </Button>
            <Button
              onClick={() => onRemoveBtnClicked(addr)}
              small
              red
              icon={<MdOutlineRemove/>}
              title={
                isSelected ? 'Cannot remove the currently used signer' : ''
              }
              disabled={isSelected}
            >
              Remove
            </Button>
          </div>
        </li>
      )
    })
    .filter(x => x)

  const showLoading = isLoading && !data
  const signersFragment = relayerURL ? (<>
    <div className="panel" id="signers">
      {recoveryLock && recoveryLock.status ?
        <div className="notice" id="recovery-request-pending" onClick={() => createRecoveryRequest()}>
          <MdOutlineWarningAmber/>
          {
            recoveryLock.status === 'requestedButNotInitiated' ?
              <>Password reset requested but not initiated for {selectedNetwork.name}. Click here to initiate it.</> :
            recoveryLock.status === 'initiationTxnPending' ?
              <>Initiation transaction is currently pending. Once mined, you will need to wait {recoveryLock.days} days for the reset to be done on {selectedNetwork.name}.</> :
            recoveryLock.status === 'waitingTimelock' ?
              <>Password reset on {selectedNetwork.name} is currently pending. {recoveryLock.remainingDays} days remaining.</> :
            recoveryLock.status === 'ready' ?
              <>Password recovery was requested but is not initiated for {selectedNetwork.name}. Click here to do so.</> :
            recoveryLock.status === 'failed' ?
              <>Something went wrong while resetting your password. Please contact support at help.ambire.com</> : null
          }
        </div>
      : null}

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
      <ul className="content">{!showLoading && privList}</ul>
    </div>
    <div className="panel">
      <div className="panel-title">Add new signer</div>
      <AddAuthSigner
        onAddBtnClicked={onAddBtnClickedHandler}
        selectedNetwork={selectedNetwork}
        selectedAcc={selectedAcc}
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

      <div id="addresses" className='panel'>
        <div className='title'>Address Book</div>
        <div className="content">
          <AddressList
            noAccounts={true}
            addresses={addresses}
            removeAddress={removeAddress}
          />
          <Button small icon={<MdOutlineAdd/>} onClick={showInputModal}>Add Address</Button>
        </div>
      </div>

      <div id="backup">
        <div className="panel">
          <div className="panel-title">Backup current account</div>
          <div className="content" id="export">
            <a
              type="button"
              href={`data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(selectedAccount)
              )}`}
              download={`${selectedAccount.id}.json`}
            >
              <Button icon={<BiExport/>}>Export</Button>
            </a>
            <div style={{ fontSize: '0.9em' }}>
            This downloads a backup of your current account ({selectedAccount.id.slice(0, 5)}...{selectedAccount.id.slice(-3)}) encrypted with
            your password. This is safe to store in iCloud/Google Drive, but you cannot use it to restore your account if you forget the password.
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Import an account from backup</div>
          <div className="content" id="import">
            <Button icon={<BiImport/>} onClick={open}>Import</Button>
            <p>...or you can drop an account backup JSON file on this page</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Security
