import { useState, useEffect } from 'react'

import { TextInput, Button, Modal, DropDown } from '../../../common'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400

const AddAuthSigner = (props) => {
    const [signerAddress, setSignerAddress] = useState({ address: '', index: 0 })
    const [signersToChoose, setChooseSigners] = useState(null)
    const [addAccErr, setAddAccErr] = useState('')
    const [modalToggle, setModalToggle] = useState(true)
    const [textInputInfo, setTextInputInfo] = useState('')
    const [disabled, setDisabled] = useState(true)
  
    const modalHandler = () => {
      setModalToggle(prevState => !prevState)
    }
  
    async function connectLedgerAndGetAccounts() {
      const provider = new LedgerSubprovider({
        networkId: 0, // @TODO: is this needed?
        ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
        //baseDerivationPath: this.baseDerivationPath
      })
      // NOTE: do not attempt to do both of these together (await Promise.all)
      // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
      // cause one call won't be aware of the other's attempt to connect
      const addresses = await provider.getAccountsAsync(50)
      const signerExtra = await provider
        ._initialDerivedKeyInfoAsync()
        .then(info => ({
          type: 'ledger',
          info: JSON.parse(JSON.stringify(info)),
        }))
      setChooseSigners({ addresses, signerExtra })
      setModalToggle(true)
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
  
    const signersToChooseModal = (
      <Modal show={modalToggle} modalClosed={modalHandler}>
        <div
          className="loginSignupWrapper chooseSigners"
          style={{ background: 'transparent' }}
        >
          <h3>Choose a signer</h3>
          <ul id="signersToChoose">
            {signersToChoose
              ? signersToChoose.addresses.map((addr, index) => (
                  <li
                    key={addr}
                    onClick={() =>
                      onSignerAddressClicked({ address: addr, index: index })
                    }
                  >
                    {addr}
                  </li>
                ))
              : null}
          </ul>
        </div>
      </Modal>
    )
  
    const addFromSignerButtons = (
      <>
        <button className="button" onClick={() => wrapErr()}>
          {/* TODO: Implememnt func for trezor */}
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
        {/* TODO: this btn should be Web3 */}
        {/* TODO: Implement func for Web3 */}
        <button className="button" onClick={() => wrapErr()}>
          <div
            className="icon"
            style={{ backgroundImage: 'url(./resources/metamask.png)' }}
          />
          Metamask / Browser
        </button>
      </>
    )
  
    const onTextInput = value => {
      if (textInputInfo.length) setTextInputInfo('')
      setSignerAddress({ ...signerAddress, address: value })
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
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1em',
          }}
        >
          <TextInput
            placeholder='Enter address'
            className="depositAddress"
            value={signerAddress.address}
            info={textInputInfo}
            onInput={onTextInput}
          />
          <DropDown title="connect wallet">{addFromSignerButtons}</DropDown>
          <div className="btns-wrapper">
            <Button disabled={disabled} onClick={() => props.onAddBtnClicked(signerAddress.address)} small>Add</Button>
          </div>
        </div>
        {signersToChoose && signersToChooseModal}
        {addAccErr ? <h3 className="error">{addAccErr}</h3> : <></>}
      </div>
    )
  }

  export default AddAuthSigner