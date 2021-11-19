import './AddAuthSigner.scss'
import { useState, useEffect } from 'react'

import { TextInput, Button, Modal, DropDown } from '../../../common'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400

const AddAuthSigner = props => {
  const [signerAddress, setSignerAddress] = useState({
    address: '',
    index: 0,
    signerExtra: {},
  })
  const [signersToChoose, setChooseSigners] = useState(null)
  const [addAccErr, setAddAccErr] = useState('')
  const [modalToggle, setModalToggle] = useState(true)
  const [textInputInfo, setTextInputInfo] = useState('')
  const [disabled, setDisabled] = useState(true)

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
    const signerExtra = await provider
      ._initialDerivedKeyInfoAsync()
      .then(info => ({
        type: 'ledger',
        info: JSON.parse(JSON.stringify(info)),
      }))
    setChooseSigners({ addresses, signerExtra })
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
    setChooseSigners({
      addresses,
      signerExtra: {
        type: 'trezor',
        info: JSON.parse(JSON.stringify(provider._initialDerivedKeyInfo)),
      },
    })
    setModalToggle(true)
  }

  async function connectWeb3AndGetAccounts() {
    debugger
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
        signerExtra: {},
      })
    setChooseSigners({ addresses: web3Accs })
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

  const onSignerAddressClicked = value => {
    setSignerAddress(value)
    modalHandler()
    setTextInputInfo(`Trezor/Ledger address # ${value.index + 1}`)
  }

  const testData = [
    '0x1111111111111111111111111111111111111111',
    '0x63de53b82e37465bf6431231ad29f3133b884463',
    '0xe1ae0619671dfb804b83d7a98ffaf937565743ce',
    '0x1506828e1bdc9b0009c29bc6e9b224ada83eec4b',
    '0xa357f01404492b3129ab3a30c6cd506773a1263e',
    '0xdd16568285be734877668acae80c451605e791fa',
    '0x63de53b82e37465bf6431231ad29f3133b884462',
    '0xe1ae0619671dfb804b83d7a98ffaf937565743cw',
    '0x1506828e1bdc9b0009c29bc6e9b224ada83eec42',
    '0xa357f01404492b3129ab3a30c6cd506773a1263a',
    '0xdd16568285be734877668acae80c451605e791f6',
    '0x63de53b82e37465bf6431231ad29f3133b884461',
    '0xe1ae0619671dfb804b83d7a98ffaf937565743c1',
    '0x1506828e1bdc9b0009c29bc6e9b224ada83eec4a',
    '0xa357f01404492b3129ab3a30c6cd506773a12636',
    '0xdd16568285be734877668acae80c451605e791f5',
    '0x63de53b82e37465bf6431231ad29f3133b884464',
    '0xe1ae0619671dfb804b83d7a98ffaf937565743c3',
    '0x1506828e1bdc9b0009c29bc6e9b224ada83eec47',
    '0xa357f01404492b3129ab3a30c6cd506773a12631',
    '0x0000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000002',
  ]

  const paginate = (arr, size) => {
    return arr.reduce((acc, val, i) => {
      let idx = Math.floor(i / size)
      let page = acc[idx] || (acc[idx] = [])
      page.push(val)

      return acc
    }, [])
  }

  const [currentPage, setCurrentPage] = useState(0)
  let pages = []
  let pageSize = 5

  if (signersToChoose) {
    pages = paginate(signersToChoose.addresses, pageSize)

    // let [prevBtnDisabled, setPrevBtnDisabled] = useState(false)
    // let [nextBtnDisabled, setNextBtnDisabled] = useState(false)
  }

  const nextPage = () => {
    if (currentPage === pages.length - 1) return
    setCurrentPage(prevState => prevState + 1)
  }

  const prevPage = () => {
    if (currentPage === 0) return
    setCurrentPage(prevState => prevState - 1)
  }

  const signersToChooseModal = (
    <Modal show={modalToggle} modalClosed={modalHandler}>
      <div
        className="loginSignupWrapper chooseSigners"
        style={{ background: 'transparent' }}
      >
        <h3>Select a signer account</h3>
        <ul id="signersToChoose" style={{ height: '275px', padding: '0' }}>
          {signersToChoose
            ? pages[currentPage].map((addr, index) => (
                <li
                  key={addr}
                  onClick={() =>
                    onSignerAddressClicked({
                      address: addr,
                      index: index,
                      signerExtra: signersToChoose.signerExtra,
                    })
                  }
                >
                  {currentPage * pageSize + index + 1}&nbsp;
                  {addr}
                  {/* <a href={props.selectedNetwork.explorerUrl+'/address/'+addr} target='_blank' rel='noreferrer'>{props.selectedNetwork.explorerUrl.split('/')[2]}</a> */}
                </li>
              ))
            : null}
        </ul>
        <div>
          {currentPage + 1}/{pages.length}
        </div>
        <button type="button" onClick={prevPage}>
          Prev
        </button>
        <button type="button" onClick={nextPage}>
          Next
        </button>
      </div>
    </Modal>
  )

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
        <DropDown style={{ height: '60px' }} title="connect wallet">
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
      {signersToChoose && signersToChooseModal}
      {addAccErr ? <h3 className="error">{addAccErr}</h3> : <></>}
    </div>
  )
}

export default AddAuthSigner
