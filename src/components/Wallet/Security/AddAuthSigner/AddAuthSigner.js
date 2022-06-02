import './AddAuthSigner.scss'
import { useState, useEffect, useCallback } from 'react'

import { TextInput, Button, DropDown, Loading } from 'components/common'
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { SelectSignerAccountModal, LedgerSignersModal } from 'components/Modals'
import { useModals } from 'hooks'
import { isFirefox } from 'lib/isFirefox'
import { validateAddAuthSignerAddress } from 'lib/validations/formValidations'
import { BsXLg } from 'react-icons/bs'
import { MdOutlineAdd } from 'react-icons/md'
import { LatticeModal } from 'components/Modals'
import { latticeInit, latticeConnect, latticeGetAddresses } from 'lib/lattice'

const AddAuthSigner = ({ selectedNetwork, selectedAcc, onAddBtnClicked }) => {
  const [signerAddress, setSignerAddress] = useState({
    address: '',
    index: 0,
  })
  const [addAccErr, setAddAccErr] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [modalToggle, setModalToggle] = useState(true)
  const [signersToChoose, setChooseSigners] = useState(null)
  const [showLoading, setShowLoading] = useState(false)
  const [textInputInfo, setTextInputInfo] = useState('')
  const { showModal } = useModals()
  const [validationFormMgs, setValidationFormMgs] = useState({ 
    success: false, 
    message: ''
  })

  const onLedgerAccountSelection = (account, signerExtra) => {
    return onSignerAddressClicked({
      address: account,
      index: signerExtra?.childIndex || 0,
    })
  }

  async function connectLedgerAndGetAccounts() {
    showModal(<LedgerSignersModal
      onLedgerAccountSelection={onLedgerAccountSelection}
      isWebHID={!isFirefox()}
    />)
  }

  async function connectTrezorAndGetAccounts() {
    /*
      const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
      engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
      engine.addProvider(new CacheSubprovider())
      engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
      */
    const provider = new TrezorSubprovider({
      trezorConnectClientApi: TrezorConnect,
    })
    const addresses = await provider.getAccountsAsync(100)
    setChooseSigners({ addresses, signerName: 'Trezor' })
    setModalToggle(true)
  }

  async function connectWeb3AndGetAccounts() {
    // @TODO: pending state; should bein the LoginORSignup (AddAccount) component
    if (typeof window.ethereum === 'undefined') {
      // @TODO catch this
      throw new Error('MetaMask not available')
    }
    const ethereum = window.ethereum
    const web3Accs = await ethereum.request({ method: 'eth_requestAccounts' })
    if (!web3Accs.length) throw new Error('No accounts connected')
    if (web3Accs.length === 1)
      return onSignerAddressClicked({
        address: web3Accs[0],
        index: 0,
      })

    setChooseSigners({ addresses: web3Accs, signerName: 'Web3' })
    setModalToggle(true)
  }

  const setLatticeAddresses = ({ addresses, deviceId, commKey, isPaired }) => {
    setChooseSigners({
      addresses, signerName: 'Lattice', signerExtra: {
        type: 'Lattice',
        deviceId: deviceId,
        commKey: commKey,
        isPaired: isPaired
      }
    })

    setModalToggle(true)
  }
  
  async function connectGridPlusAndGetAccounts() {
    if (selectedAcc.signerExtra && 
      selectedAcc.signerExtra.type === 'Lattice' && 
      selectedAcc.signerExtra.isPaired) {
        const { commKey, deviceId } = selectedAcc.signerExtra
        const client = latticeInit(commKey)

        setShowLoading(true)

        const { isPaired, errConnect } = await latticeConnect(client, deviceId)
        if (errConnect) {
          setShowLoading(false)
          setAddAccErr(errConnect.message || errConnect)

          return
        }

        if (!isPaired) {
          setShowLoading(false)
          // Canceling the visualization of the secret code on the device's screen.
          client.pair('')
          setAddAccErr(`The Lattice device is not paired! Please re-add your account!.`, { timeout: 30000 })
          
          return 
        }

        const { res, errGetAddresses } = await latticeGetAddresses(client)
        if (errGetAddresses) {
            setShowLoading(false)
            setAddAccErr(`Lattice: ${errGetAddresses}`, { error: true })

            return
        }
        
        if (res) {
          setShowLoading(false)
          setLatticeAddresses({ addresses: res, deviceId, commKey, isPaired: true })
        }
      } else {
        showModal(<LatticeModal addresses={setLatticeAddresses} />)
      }
  }

  const modalHandler = () => {
    setModalToggle(prevState => !prevState)
  }

  const wrapErr = async fn => {
    setAddAccErr('')
    try {
      await fn()
    } catch (e) {
      console.error(e)
      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
  }

  const onSignerAddressClicked = useCallback(value => {
    setSignerAddress(value)
    modalHandler()
    if (signersToChoose) setTextInputInfo(`${signersToChoose.signerName} address # ${value.index + 1}`)
  }, [signersToChoose])

  useEffect(() => {
    if (modalToggle && signersToChoose)
      showModal(
        <SelectSignerAccountModal
          signersToChoose={signersToChoose.addresses}
          selectedNetwork={selectedNetwork}
          onSignerAddressClicked={onSignerAddressClicked}
          description={`You will authorize the selected ${signersToChoose.signerName} address to sign transactions for your account.`}
        />
      )
  }, [modalToggle, onSignerAddressClicked, selectedNetwork, showModal, signersToChoose])

  const addFromSignerButtons = (
    <div className="wallet-btns-wrapper">
      <Button
        onClick={() => wrapErr(connectTrezorAndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/trezor.png)' }}
        />
        Trezor
      </Button>
      <Button
        onClick={() => wrapErr(connectLedgerAndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/ledger.png)' }}
        />
        Ledger
      </Button>
      <Button
        onClick={() => wrapErr(connectGridPlusAndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/grid-plus.png)' }}
        />
        Grid+ Lattice1
      </Button>
      <Button
        onClick={() => wrapErr(connectWeb3AndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/metamask.png)' }}
        />
        Metamask / Browser
      </Button>
    </div>
  )

  const onTextInput = value => {
    if (textInputInfo.length) setTextInputInfo('')
    setSignerAddress({ ...signerAddress, address: value })
  }

  useEffect(() => {
    const isAddressValid = validateAddAuthSignerAddress(signerAddress.address, selectedAcc.id)
    
    setDisabled(!isAddressValid.success)

    setValidationFormMgs({ 
      success: isAddressValid.success, 
      message: isAddressValid.message ? isAddressValid.message : ''
    })

  }, [selectedAcc, signerAddress.address])

  return (
    <div className="content">
      {showLoading && 
      (<>
        <h3>It may takes a while.</h3>
        <h3>Please wait...</h3>
        <Loading />
      </>)}
      {!showLoading && (<div className="signer">
        <div className="signer-address-input">
          <TextInput
            placeholder="Enter signer address"
            className="depositAddress"
            value={signerAddress.address}
            info={textInputInfo}
            onInput={onTextInput}
          />
          <DropDown
            style={{ height: '60px' }}
            title="Connect signer"
            closeOnClick
          >
            {addFromSignerButtons}
          </DropDown>
        </div>
        <div className="btns-wrapper">
          <Button
            disabled={disabled}
            icon={<MdOutlineAdd/>}
            onClick={() => onAddBtnClicked(signerAddress)}
            small
          >
            Add
          </Button>
        </div>
      </div>)}
      { validationFormMgs.message && 
        (<div className='validation-error'><BsXLg size={12}/>&nbsp;{validationFormMgs.message}</div>) 
      }
      {addAccErr ? <h3 className="error">{addAccErr}</h3> : <></>}
    </div>
  )
}

export default AddAuthSigner
