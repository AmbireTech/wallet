import { useCallback, useEffect, useState } from 'react'
import cn from 'classnames'
import { BsXLg } from 'react-icons/bs'
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import TrezorConnect from '@trezor/connect-web'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400

import { ledgerGetAddresses, PARENT_HD_PATH } from 'lib/ledgerWebHID'
import { latticeConnect, latticeGetAddresses, latticeInit } from 'lib/lattice'
import { validateAddAuthSignerAddress } from 'lib/validations/formValidations'
import { isFirefox } from 'lib/isFirefox'
import humanizeError from 'lib/errors/metamask'

import { useToasts } from 'hooks/toasts'
import { Button, Modal, TextInput } from 'components/common'
import LatticePair from 'components/common/LatticePair/LatticePair'
import SelectSignerAccount from 'components/common/SelectSignerAccount/SelectSignerAccount'

import { ReactComponent as TrezorIcon } from 'resources/providers/trezor.svg'
import { ReactComponent as LedgerIcon } from 'resources/providers/ledger.svg'
import { ReactComponent as GridPlusIcon } from 'resources/providers/grid-plus.svg'
import { ReactComponent as MetaMaskIcon } from 'resources/providers/metamask-fox.svg'

import styles from './AddAuthSignerModal.module.scss'

const AddAuthSignerModal = ({ onAddBtnClicked, selectedAcc, selectedNetwork }) => {
  const { addToast } = useToasts()

  const [disabled, setDisabled] = useState(true)
  const [signerAddress, setSignerAddress] = useState({
    address: '',
    index: 0
  })

  const [isLatticePairing, setIsLatticePairing] = useState(false)
  const [signersToChoose, setChooseSigners] = useState(null)
  const [textInputInfo, setTextInputInfo] = useState('')
  const [validationFormMgs, setValidationFormMgs] = useState({
    success: false,
    message: ''
  })

  const onSignerAddressClicked = useCallback(
    (value) => {
      setSignerAddress(value)
      if (signersToChoose)
        setTextInputInfo(`${signersToChoose.signerName} address # ${value.index + 1}`)
      setChooseSigners(null)
    },
    [signersToChoose]
  )

  async function connectLedgerAndGetAccounts() {
    if (isFirefox()) {
      await connectLedgerAndGetAccountsU2F()
    } else {
      await connectLedgerAndGetAccountsWebHID()
    }
  }

  async function connectLedgerAndGetAccountsU2F() {
    const provider = new LedgerSubprovider({
      networkId: 0, // @TODO: is this needed?
      ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
      baseDerivationPath: PARENT_HD_PATH
    })
    // NOTE: do not attempt to do both of these together (await Promise.all)
    // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
    // cause one call won't be aware of the other's attempt to connect
    const addresses = await provider.getAccountsAsync(100)
    setChooseSigners({ addresses, signerName: 'Ledger' })
  }

  async function connectLedgerAndGetAccountsWebHID() {
    let error = null
    try {
      const addrData = await ledgerGetAddresses()
      if (addrData.length === 1) {
        return onSignerAddressClicked({
          address: addrData[0],
          index: 0
        })
      }
      setChooseSigners({ address: addrData, signerName: 'Ledger' })
    } catch (e) {
      console.log(e)
      if (e.statusCode && e.id === 'InvalidChannel') {
        error = 'Invalid channel'
      } else if (e.statusCode && e.statusCode === 25873) {
        error = 'Please make sure your ledger is connected and the ethereum app is open'
      } else {
        error = e.message
      }
    }

    if (error) {
      addToast(`Ledger error: ${error.message || error}`, { error: true })
    }
  }

  async function connectTrezorAndGetAccounts() {
    /*
      const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
      engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
      engine.addProvider(new CacheSubprovider())
      engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
      */
    TrezorConnect.manifest({
      email: 'contactus@ambire.com',
      appUrl: 'https://wallet.ambire.com'
    })
    const provider = new TrezorSubprovider({
      trezorConnectClientApi: TrezorConnect
    })
    const addresses = await provider.getAccountsAsync(100)
    setChooseSigners({ addresses, signerName: 'Trezor' })
  }

  async function connectWeb3AndGetAccounts() {
    // @TODO: pending state; should bein the LoginORSignup (AddAccount) component
    if (typeof window.ethereum === 'undefined') {
      // @TODO catch this
      throw new Error('MetaMask not available')
    }
    const ethereum = window.ethereum
    const permissions = await ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }]
    })

    const accountsPermission = permissions.find(
      (permission) => permission.parentCapability === 'eth_accounts'
    )

    if (!accountsPermission) {
      throw new Error('No accounts connected')
    }

    // Depending on the MM version, the addresses are returned by a different caveat identifier.
    // For instance, in MM 9.8.4 we can find the addresses by `caveat.name === 'exposedAccounts'`,
    // while in the newer MM versions by `caveat.type ==='restrictReturnedAccounts'`.
    const addresses = accountsPermission.caveats.find(
      (caveat) => caveat.type === 'restrictReturnedAccounts' || caveat.name === 'exposedAccounts'
    ).value

    if (addresses.length === 1)
      return onSignerAddressClicked({
        address: addresses[0],
        index: 0
      })

    setChooseSigners({ addresses, signerName: 'Web3' })
  }

  const setLatticeAddresses = ({ addresses, deviceId, commKey, isPaired }) => {
    setChooseSigners({
      addresses,
      signerName: 'Lattice',
      signerExtra: {
        type: 'Lattice',
        deviceId,
        commKey,
        isPaired
      }
    })

    setIsLatticePairing(false)
  }

  // In case Lattice is already paired, we are going to the final step of choosing the Signer account/address
  async function connectGridPlusAndGetAccounts() {
    if (
      selectedAcc.signerExtra &&
      selectedAcc.signerExtra.type === 'Lattice' &&
      selectedAcc.signerExtra.isPaired
    ) {
      const { commKey, deviceId } = selectedAcc.signerExtra
      const client = latticeInit(commKey)

      const { isPaired, errConnect } = await latticeConnect(client, deviceId)
      if (errConnect) {
        setIsLatticePairing(false)
        addToast(errConnect.message || errConnect, { error: true })

        return
      }

      if (!isPaired) {
        setIsLatticePairing(false)
        // Canceling the visualization of the secret code on the device's screen.
        client.pair('')

        addToast('The Lattice device is not paired! Please re-add your account!.', { error: true })

        return
      }

      const { res, errGetAddresses } = await latticeGetAddresses(client)
      if (errGetAddresses) {
        setIsLatticePairing(false)
        addToast(`Lattice: ${errGetAddresses}`, { error: true })

        return
      }

      if (res) {
        setIsLatticePairing(false)
        setLatticeAddresses({ addresses: res, deviceId, commKey, isPaired: true })
      }
    } else {
      setIsLatticePairing(true)
    }
  }

  const wrapErr = async (fn) => {
    try {
      await fn()
    } catch (e) {
      console.error(e)

      const humanizedError = humanizeError(e)
      if (humanizedError) return addToast(humanizedError, { error: true })

      addToast(`Unexpected error: ${e.message || e}`, { error: true })
    }
  }

  const handleSelectSignerAccountModalCloseClicked = useCallback(() => setChooseSigners(null), [])

  const onTextInput = (value) => {
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

  // Here we are choosing the Signer firstly
  const stepOne = () => (
    <>
      <h2 className={cn(styles.subtitle, styles.chooseSignerSubtitle)}>Choose Signer</h2>
      <div className={styles.signers}>
        <div className={styles.signer} onClick={() => wrapErr(connectTrezorAndGetAccounts)}>
          <TrezorIcon className={styles.trezor} />
        </div>
        <div className={styles.signer} onClick={() => wrapErr(connectLedgerAndGetAccounts)}>
          <LedgerIcon className={styles.ledger} />
        </div>
        <div className={styles.signer} onClick={() => wrapErr(connectGridPlusAndGetAccounts)}>
          <GridPlusIcon className={styles.gridplus} />
        </div>
        <div className={styles.signer} onClick={() => wrapErr(connectWeb3AndGetAccounts)}>
          <MetaMaskIcon className={styles.metamask} />
        </div>
      </div>

      <p className={styles.subtitle}>- or -</p>

      <div className={styles.manualSigner}>
        <TextInput
          placeholder="Enter signer address manually"
          className={styles.signerAddress}
          value={signerAddress.address}
          info={textInputInfo}
          onInput={onTextInput}
        />

        {validationFormMgs.message && (
          <div className={styles.errorMessage}>
            <BsXLg size={12} /> {validationFormMgs.message}
          </div>
        )}

        <Button
          className={styles.button}
          disabled={disabled}
          onClick={() => onAddBtnClicked(signerAddress)}
          variant="primaryGradient"
        >
          Add
        </Button>
      </div>
    </>
  )
  // In case of Lattice Signer, we are handling the Lattice Pairing process on our end in the same Modal
  const stepTwo = () => (
    <LatticePair addresses={setLatticeAddresses} title="Connect to Lattice Device" />
  )

  // Once we have a paired Signer, we need to select which Signer Accounts/address to use as a final step
  const stepThree = () => (
    <SelectSignerAccount
      showTitle
      signersToChoose={signersToChoose.addresses}
      selectedNetwork={selectedNetwork}
      onSignerAddressClicked={onSignerAddressClicked}
      description={`You will authorize the selected ${signersToChoose.signerName} address to sign transactions for your account.`}
      onCloseBtnClicked={handleSelectSignerAccountModalCloseClicked}
    />
  )

  const steps = [stepOne, stepTwo, stepThree]

  // steps are zero-index based
  const getCurrentStepIndex = () => {
    if (isLatticePairing) return 1

    if (signersToChoose) return 2

    return 0
  }

  return (
    <Modal
      title="Add Signer"
      className={styles.wrapper}
      isBackBtnShown={getCurrentStepIndex() > 0}
      isTitleCentered
      onBack={() => {
        // Going back to step one
        setIsLatticePairing(false)
        setChooseSigners(null)
      }}
    >
      {steps[getCurrentStepIndex()]()}
    </Modal>
  )
}

export default AddAuthSignerModal
