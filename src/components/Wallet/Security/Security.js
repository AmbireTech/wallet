import './Security.scss'

import { MdOutlineAdd } from 'react-icons/md'
import { RiDragDropLine } from 'react-icons/ri'
import { useState, useEffect, useCallback } from 'react'
import { Loading, TextInput, Button } from '../../common'
import { Interface } from 'ethers/lib/utils'
import accountPresets from '../../../consts/accountPresets'
import privilegesOptions from '../../../consts/privilegesOptions'
import { useRelayerData, useModals } from '../../../hooks'
import { InputModal } from '../../Modals'
import AddressList from '../../common/AddressBook/AddressList/AddressList'
import { isValidAddress } from '../../../helpers/address'
import AddAuthSigner from './AddAuthSigner/AddAuthSigner'
import { useToasts } from '../../../hooks/toasts'
import { useHistory } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'

const IDENTITY_INTERFACE = new Interface(
  require('adex-protocol-eth/abi/Identity5.2')
)

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addressBook,
  addRequest,
  onAddAccount,
}) => {
  const { addresses, addAddress, removeAddress } = addressBook

  const { showModal } = useModals()
  const [ cacheBreak, setCacheBreak ] = useState(() => Date.now())
  
  useEffect(() => {
    if (Date.now() - cacheBreak > 30000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), 35000)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData(url)
  const privileges = data ? data.privileges : {}
  const { addToast } = useToasts()
  const history = useHistory()


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
      onAddAccount({ ...account, signer: { address: address } })
      addToast(
        'This signer is now the default. If it is a hardware wallet, you will have to re-add the account manually to connect it directly, otherwise you will have to add this signer address to your web3 wallet.',
        { timeout: 30000 }
      )
    }

    history.push('/wallet/security')
  }

  const selectedAccount = accounts.find(x => x.id === selectedAcc)

  const privList = Object.entries(privileges)
    .map(([addr, privValue]) => {
      if (!privValue) return null
      const isQuickAcc = addr === accountPresets.quickAccManager
      const privText = isQuickAcc
        ? `Email/passphrase signer (${selectedAccount.email || 'unknown email'})`
        : addr
      const signerAddress = isQuickAcc
        ? selectedAccount.signer.quickAccManager
        : selectedAccount.signer.address
      const isSelected = signerAddress === addr

      return (
        <li key={addr}>
          <TextInput className="depositAddress" value={privText} disabled />
          <div className="btns-wrapper">
            <Button
              disabled={isSelected}
              onClick={() =>
                onMakeDefaultBtnClicked(selectedAccount, addr, isQuickAcc)
              }
              small
            >
              {isSelected ? 'Current signer' : 'Make default'}
            </Button>
            <Button
              onClick={() => onRemoveBtnClicked(addr)}
              small
              red
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

  const modalInputs = [{ label: 'Name', placeholder: 'My Address' }, { label: 'Address', placeholder: '0x', validate: value => isValidAddress(value) }] 
  const inputModal = <InputModal title="Add New Address" inputs={modalInputs} onClose={([name, address]) => addAddress(name, address)}></InputModal>
  const showInputModal = () => showModal(inputModal)

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const reader = new FileReader()
    
    if (rejectedFiles.length) {
      addToast(`${rejectedFiles[0].file.path} - ${rejectedFiles[0].file.size / 1024} KB. ${rejectedFiles[0].errors[0].message}.`, { error: true })
    }

    if (acceptedFiles.length){
      const file = acceptedFiles[0]

      reader.readAsText(file,'UTF-8')
      reader.onload = readerEvent => {
          const content = readerEvent.target.result
          const fileContent = JSON.parse(content)
          const neededKeys = ['salt', 'identityFactoryAddr', 'baseIdentityAddr', 'bytecode', 'signer']
          const isFileContainsNeededKeys = neededKeys.every(key => Object.keys(fileContent).includes(key))

          if (isFileContainsNeededKeys) onAddAccount(fileContent)
          else 
          addToast('The imported file does not contain needed account data.', { error: true })
      }
    }
  }, [addToast, onAddAccount])

  const maxFileSize = 3072

  const fileSizeValidator = file => {
    if (file.size > maxFileSize) {
      return {
        code: "file-size-too-large",
        message: `The file size is larger than ${maxFileSize / 1024} KB.`
      }
    }

    return null
  }

  const { getRootProps, getInputProps, open, isDragActive, isDragAccept, isDragReject } = useDropzone({ onDrop, noClick: true, accept: 'application/json', maxFiles: 1, validator: fileSizeValidator })
 
  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook/service
  // and aggregate from that
  if (!relayerURL)
    return (
      <section id="security">
        <h3 className="error">
          Unsupported: not currently connected to a relayer.
        </h3>
      </section>
    )
  return (
    <section id="security" className={(isDragActive ? 'activeStyle ' : '') + (isDragAccept ? 'acceptStyle ' : '') + (isDragReject ? 'rejectStyle ' : '')}>
      {(isDragAccept || isDragReject) && (<div className={isDragAccept ? 'acceptStyleIcon' : 'rejectStyleIcon'}><RiDragDropLine size={100}/></div>) }
      
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="panel">
          <div className="panel-title">Authorized signers</div>
          {errMsg && (
            <h3 className="error">Error getting authorized signers: {errMsg}</h3>
          )}
          {isLoading && <Loading />}
          <ul className="content">{!isLoading && privList}</ul>
        </div>
        <div className="panel">
          <div className="panel-title">Add new signer</div>
          <AddAuthSigner
            onAddBtnClicked={onAddBtnClickedHandler}
            selectedNetwork={selectedNetwork}
          />
        </div>
    
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
        <div className="panel">
          <div className="panel-title">Backup current account</div>
          <div className="content">
            <a
              type="button"
              href={`data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(selectedAccount)
              )}`}
              download={`${selectedAccount.id}.json`}
            >
              <Button>Export</Button>
            </a>
            This will download a JSON backup of your current account {selectedAccount.id}, encrypted with
            your account passphrase.
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Import account from json file</div>
          <div className="content import">
            <Button small onClick={open}>Import</Button> 
            <p>The entire page is drop zone</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Security
