import './AddAuthSigner.scss'
import { useState, useEffect, useCallback } from 'react'

import { TextInput, Button, DropDown } from '../../../common'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { SelectSignerAccountModal } from '../../../Modals'
import { useModals } from '../../../../hooks'

const AddAuthSigner = props => {
  const [signerAddress, setSignerAddress] = useState({
    address: '',
    index: 0,
  })
  const [addAccErr, setAddAccErr] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [modalToggle, setModalToggle] = useState(true)
  const [signersToChoose, setChooseSigners] = useState(null)
  const [textInputInfo, setTextInputInfo] = useState('')
  const { showModal } = useModals()

  async function connectLedgerAndGetAccounts() {
    const provider = new LedgerSubprovider({
      networkId: 0, // @TODO: is this needed?
      ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
      //baseDerivationPath: this.baseDerivationPath
    })
    // NOTE: do not attempt to do both of these together (await Promise.all)
    // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
    // cause one call won't be aware of the other's attempt to connect
    const addresses = await provider.getAccountsAsync(100)
    setChooseSigners({ addresses, signerName: 'Ledger' })
    setModalToggle(true)
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
    setTextInputInfo(`${signersToChoose.signerName} address # ${value.index + 1}`)
  }, [signersToChoose])

  useEffect(() => {
    if (modalToggle && signersToChoose)
      showModal(
        <SelectSignerAccountModal
          signersToChoose={signersToChoose.addresses}
          selectedNetwork={props.selectedNetwork}
          onSignerAddressClicked={onSignerAddressClicked}
          description={`You will authorize the selected ${signersToChoose.signerName} address to sign transactions for your account.`}
        />
      )
  }, [modalToggle, onSignerAddressClicked, props.selectedNetwork, showModal, signersToChoose])

  const addFromSignerButtons = (
    <div className="wallet-btns-wrapper">
      <button
        className="button"
        onClick={() => wrapErr(connectTrezorAndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/trezor.png)' }}
        />
        Trezor
      </button>
      <button
        className="button"
        onClick={() => wrapErr(connectLedgerAndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/ledger.png)' }}
        />
        Ledger
      </button>
      <button
        className="button"
        onClick={() => wrapErr(connectWeb3AndGetAccounts)}
      >
        <div
          className="icon"
          style={{ backgroundImage: 'url(./resources/metamask.png)' }}
        />
        Metamask / Browser
      </button>
    </div>
  )

  const onTextInput = value => {
    if (textInputInfo.length) setTextInputInfo('')
    setSignerAddress({ ...signerAddress, address: value })
    console.log('signerAddress', signerAddress)
  }

  useEffect(() => {
    const isAddressValid = /^0x[a-fA-F0-9]{40}$/.test(signerAddress.address)
    setDisabled(!isAddressValid)
  }, [signerAddress.address])

  return (
    <div className="content">
      <div
        style={{
          display: 'flex',
          // alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextInput
          placeholder="Enter address"
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
        <div className="btns-wrapper">
          <Button
            disabled={disabled}
            onClick={() => props.onAddBtnClicked(signerAddress)}
            small
          >
            Add
          </Button>
        </div>
      </div>
      {addAccErr ? <h3 className="error">{addAccErr}</h3> : <></>}
    </div>
  )
}

export default AddAuthSigner
