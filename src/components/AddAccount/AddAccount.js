/* eslint-disable no-console */
import cn from 'classnames'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import LoginOrSignup from 'components/LoginOrSignupForm/LoginOrSignupForm'
import TrezorConnect from '@trezor/connect-web'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { hexZeroPad, getAddress } from 'ethers/lib/utils'
import { generateAddress2 } from 'ethereumjs-util'
import { getProxyDeployBytecode } from 'adex-protocol-eth/js/IdentityProxyDeploy'
import { fetch, fetchPost, fetchGet } from 'lib/fetch'
import accountPresets from 'ambire-common/src/constants/accountPresets'
import { useToasts } from 'hooks/toasts'
import SelectSignerAccountModal from 'components/Modals/SelectSignerAccountModal/SelectSignerAccountModal'
import { useModals } from 'hooks'
import { Loading, Button, ToolTip } from 'components/common'
import { ledgerGetAddresses, PARENT_HD_PATH } from 'lib/ledgerWebHID'
import { isFirefox } from 'lib/isFirefox'
import humanizeError from 'lib/errors/metamask'
import { VscJson } from 'react-icons/vsc'
import { useDropzone } from 'react-dropzone'
import {
  validateImportedAccountProps,
  fileSizeValidator
} from 'lib/validations/importedAccountValidations'
import LatticeModal from 'components/Modals/LatticeModal/LatticeModal'
import Lottie from 'lottie-react'

import { useThemeContext } from 'context/ThemeProvider/ThemeProvider'

// Icons
import { ReactComponent as AmbireLogo } from 'resources/logo.svg'
import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as TrezorIcon } from 'resources/providers/trezor.svg'
import { ReactComponent as LedgerIcon } from 'resources/providers/ledger.svg'
import { ReactComponent as GridPlusIcon } from 'resources/providers/grid-plus.svg'
import { ReactComponent as MetamaskIcon } from 'resources/providers/metamask-fox.svg'
import { ReactComponent as EmailIcon } from 'resources/icons/email.svg'
import styles from './AddAccount.module.scss'
import AnimationData from './assets/confirm-email.json'

TrezorConnect.manifest({
  email: 'contactus@ambire.com',
  appUrl: 'https://wallet.ambire.com'
})

export default function AddAccount({ relayerURL, onAddAccount, utmTracking, pluginData }) {
  const { theme } = useThemeContext()
  const [signersToChoose, setChooseSigners] = useState(null)
  const [err, setErr] = useState('')
  const [addAccErr, setAddAccErr] = useState('')
  const [inProgress, setInProgress] = useState(false)
  const { addToast } = useToasts()
  const { showModal } = useModals()
  const [isCreateRespCompleted, setIsCreateRespCompleted] = useState(null)
  const [requiresEmailConfFor, setRequiresConfFor] = useState(false)

  const wrapProgress = async (fn, type = true) => {
    setInProgress(type)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
    setInProgress(false)
  }

  const wrapErr = async (fn) => {
    setAddAccErr('')
    try {
      await fn()
    } catch (e) {
      console.error(e)
      setInProgress(false)

      const humanizedError = humanizeError(e)
      if (humanizedError) return setAddAccErr(humanizedError)

      setAddAccErr(`Unexpected error: ${e.message || e}`)
    }
  }

  // EOA implementations
  // Add or create accounts from Trezor/Ledger/Metamask/etc.
  const createFromEOA = useCallback(
    async (addr, signerType) => {
      const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
      const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
      const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
      const identityAddr = getAddress(
        `0x${generateAddress2(
          // Converting to buffer is required in ethereumjs-util version: 7.1.3
          Buffer.from(identityFactoryAddr.slice(2), 'hex'),
          Buffer.from(salt.slice(2), 'hex'),
          Buffer.from(bytecode.slice(2), 'hex')
        ).toString('hex')}`
      )

      const utm = utmTracking.getLatestUtmData()

      if (relayerURL) {
        const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
          salt,
          identityFactoryAddr,
          baseIdentityAddr,
          privileges,
          signerType,
          ...(utm.length && { utm })
        })
        if (createResp.success) {
          utmTracking.resetUtm()
        }
        if (
          !createResp.success &&
          !(createResp.message && createResp.message.includes('already exists'))
        )
          throw createResp
      }

      return {
        id: identityAddr,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer: { address: getAddress(addr) }
      }
    },
    [relayerURL, utmTracking]
  )

  const createFromJSON = async ({
    salt,
    baseIdentityAddr,
    identityFactoryAddr,
    signer,
    identityAddr: passedIdentityAddr
  }) => {
    if (!signer.address) throw Error('Importing account with no specified signer in the json')

    const privileges = [
      [
        getAddress(signer.address),
        '0x0000000000000000000000000000000000000000000000000000000000000001'
      ]
    ]

    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress(
      `0x${generateAddress2(
        // Converting to buffer is required in ethereumjs-util version: 7.1.3
        Buffer.from(identityFactoryAddr.slice(2), 'hex'),
        Buffer.from(salt.slice(2), 'hex'),
        Buffer.from(bytecode.slice(2), 'hex')
      ).toString('hex')}`
    )

    if (relayerURL) {
      if (identityAddr.toLowerCase() === passedIdentityAddr.toLowerCase()) {
        const createResp = await fetch(`${relayerURL}/identity/${identityAddr}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            salt,
            identityFactoryAddr,
            baseIdentityAddr,
            privileges,
            signer
          })
        })
        const [status, body] = [createResp.status, await createResp.json()]
        if (status !== 409 && body.success) {
          utmTracking.resetUtm()
          addToast(`Created account ${identityAddr}`, {
            error: false
          })
        }

        return {
          id: identityAddr,
          salt,
          identityFactoryAddr,
          baseIdentityAddr,
          bytecode,
          signer
        }
      }
      addToast(`Provided addresses mismatched, calculated ${identityAddr}`, {
        error: true
      })
    }
  }

  const getAccountByAddr = useCallback(
    async (idAddr, signerAddr) => {
      // In principle, we need these values to be able to operate in relayerless mode,
      // so we just store them in all cases
      // Plus, in the future this call may be used to retrieve other things
      const { salt, identityFactoryAddr, baseIdentityAddr, bytecode } = await fetch(
        `${relayerURL}/identity/${idAddr}`
      ).then((r) => r.json())
      if (!(salt && identityFactoryAddr && baseIdentityAddr && bytecode))
        throw new Error(`Incomplete data from relayer for ${idAddr}`)
      return {
        id: idAddr,
        salt,
        identityFactoryAddr,
        baseIdentityAddr,
        bytecode,
        signer: { address: signerAddr }
      }
    },
    [relayerURL]
  )

  const getOwnedByEOAs = useCallback(
    async (eoas) => {
      const allUniqueOwned = {}

      await Promise.all(
        eoas.map(async (signerAddr) => {
          const resp = await fetch(
            `${relayerURL}/identity/any/by-owner/${signerAddr}?includeFormerlyOwned=true`
          )
          const privEntries = Object.entries(await resp.json())
          // discard the privileges value, we do not need it as we wanna add all accounts EVER owned by this eoa
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          privEntries.forEach(([entryId, _]) => {
            allUniqueOwned[entryId] = getAddress(signerAddr)
          })
        })
      )

      return Promise.all(
        Object.entries(allUniqueOwned).map(([entryId, signer]) => getAccountByAddr(entryId, signer))
      )
    },
    [getAccountByAddr, relayerURL]
  )

  const onEOASelected = useCallback(
    async (addr, signerExtra) => {
      const addAccount = (acc, opts) => onAddAccount({ ...acc, signerExtra }, opts)
      // when there is no relayer, we can only add the 'default' account created from that EOA
      // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
      //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
      if (!relayerURL)
        return addAccount(await createFromEOA(addr, signerExtra.type), { select: true })
      // otherwise check which accs we already own and add them
      const owned = await getOwnedByEOAs([addr])
      if (!owned.length) {
        addAccount(await createFromEOA(addr, signerExtra.type), { select: true, isNew: true })
      } else {
        addToast(`Found ${owned.length} existing accounts with signer ${addr}`, { timeout: 15000 })
        owned.forEach((acc, i) => addAccount(acc, { select: i === 0 }))
      }
    },
    [addToast, createFromEOA, getOwnedByEOAs, onAddAccount, relayerURL]
  )

  async function connectWeb3AndGetAccounts() {
    if (typeof window.ethereum === 'undefined') {
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

    try {
      // Depending on the MM version, the addresses are returned by a different caveat identifier.
      // For instance, in MM 9.8.4 we can find the addresses by `caveat.name === 'exposedAccounts'`,
      // while in the newer MM versions by `caveat.type ==='restrictReturnedAccounts'`.
      const addresses = accountsPermission.caveats.find(
        (caveat) => caveat.type === 'restrictReturnedAccounts' || caveat.name === 'exposedAccounts'
      ).value

      if (addresses.length === 1) return await onEOASelected(addresses[0], { type: 'Web3' })

      setChooseSigners({ addresses, signerName: 'Web3' })
    } catch {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

      if (!accounts.length || accounts.length === 0) {
        addToast('No accounts connected', { error: true })

        return
      }

      onEOASelected(accounts[0], { type: 'Web3' })
    }
  }

  const getGridPlusAddresses = ({ addresses, deviceId, commKey, isPaired }) => {
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
  }

  async function connectGridPlusAndGetAccounts() {
    showModal(<LatticeModal addresses={getGridPlusAddresses} />)
  }

  async function connectTrezorAndGetAccounts() {
    /*
    const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
    engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
    engine.addProvider(new CacheSubprovider())
    engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
    */
    const provider = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
    const addresses = await provider.getAccountsAsync(50)
    setChooseSigners({
      addresses,
      signerName: 'Trezor',
      signerExtra: {
        type: 'trezor',
        // eslint-disable-next-line no-underscore-dangle
        info: JSON.parse(JSON.stringify(provider._initialDerivedKeyInfo))
      }
    })
  }

  async function connectLedgerAndGetAccountsU2F() {
    const provider = new LedgerSubprovider({
      networkId: 0, // @TODO: probably not needed
      ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
      baseDerivationPath: PARENT_HD_PATH
    })
    // NOTE: do not attempt to do both of these together (await Promise.all)
    // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
    // cause one call won't be aware of the other's attempt to connect
    const addresses = await provider.getAccountsAsync(50)
    // eslint-disable-next-line no-underscore-dangle
    const signerExtra = await provider._initialDerivedKeyInfoAsync().then((info) => ({
      type: 'ledger',
      info: JSON.parse(JSON.stringify(info))
    }))

    setChooseSigners({ addresses, signerName: 'Ledger', signerExtra })
  }

  async function connectLedgerAndGetAccountsWebHID() {
    let error = null
    try {
      const addrData = await ledgerGetAddresses()
      const signerExtra = { type: 'ledger', transportProtocol: 'webHID' }
      if (addrData.length === 1) {
        onEOASelected(addrData[0], signerExtra)
      } else {
        setChooseSigners({ addresses: addrData, signerName: 'Ledger', signerExtra })
      }
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
      setAddAccErr(`Ledger error: ${error.message || error}`)
    }
  }

  async function connectLedgerAndGetAccounts() {
    if (isFirefox()) {
      await connectLedgerAndGetAccountsU2F()
    } else {
      await connectLedgerAndGetAccountsWebHID()
    }
  }

  const onSignerAddressClicked = useCallback(
    (val) => {
      wrapErr(() => onEOASelected(val.address, signersToChoose.signerExtra))
      setChooseSigners(null)
    },
    [onEOASelected, signersToChoose]
  )

  const handleSelectSignerAccountModalCloseClicked = useCallback(() => setChooseSigners(null), [])

  // The UI for choosing a signer to create/add an account with, for example
  // when connecting a hardware wallet, it has many addrs you can choose from
  useEffect(() => {
    if (signersToChoose) {
      showModal(
        <SelectSignerAccountModal
          signersToChoose={signersToChoose.addresses}
          onSignerAddressClicked={onSignerAddressClicked}
          description={`Signer address is the ${signersToChoose.signerName} address you will use to sign transactions on Ambire Wallet.
                    А new account will be created using this signer if you don’t have one.`}
          isCloseBtnShown
          onCloseBtnClicked={handleSelectSignerAccountModalCloseClicked}
        />
      )
    }
  }, [
    handleSelectSignerAccountModalCloseClicked,
    onSignerAddressClicked,
    showModal,
    signersToChoose
  ])

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      const reader = new FileReader()

      if (rejectedFiles.length) {
        addToast(
          `${rejectedFiles[0].file.path} - ${(rejectedFiles[0].file.size / 1024).toFixed(2)} KB. ${
            rejectedFiles[0].errors[0].message
          }`,
          { error: true }
        )
      }

      if (!acceptedFiles.length) return
      const file = acceptedFiles[0]

      reader.readAsText(file, 'UTF-8')
      reader.onload = async (readerEvent) => {
        const content = readerEvent.target.result
        const fileContent = JSON.parse(content)
        const validatedFile = validateImportedAccountProps(fileContent)
        if (!validatedFile.success) {
          addToast(validatedFile.message, { error: true })
          return
        }
        const identityCreation = {
          salt: fileContent.salt,
          baseIdentityAddr: fileContent.baseIdentityAddr,
          signer: fileContent.signer,
          identityFactoryAddr: fileContent.identityFactoryAddr,
          identityAddr: fileContent.id
        }

        try {
          const createdFromJSON = await createFromJSON(identityCreation)
          if (!createdFromJSON) throw Error('Failed to create from json!')
          onAddAccount(createdFromJSON, { select: true })
        } catch (e) {
          addToast(`Account imported as view only Error: ${e.message}`, {
            error: true
          })
          onAddAccount(fileContent, { select: true })
        }
      }
    },
    [addToast, onAddAccount]
  )

  const { getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: 'application/json',
    maxFiles: 1,
    validator: fileSizeValidator
  })

  const handleBackBtnClicked = () => {
    setRequiresConfFor((prev) => !prev)
  }

  // Adding accounts from existing signers
  const addFromSignerButtons = (
    <>
      <button type="button" onClick={() => wrapProgress(connectTrezorAndGetAccounts, 'hwwallet')}>
        {/* Trezor */}
        <TrezorIcon />
      </button>
      <button type="button" onClick={() => wrapProgress(connectLedgerAndGetAccounts, 'hwwallet')}>
        {/* Ledger */}
        <LedgerIcon />
      </button>
      <button type="button" onClick={() => wrapProgress(connectGridPlusAndGetAccounts, 'hwwallet')}>
        {/* Grid+ Lattice1 */}
        <GridPlusIcon className={styles.gridplus} />
      </button>
      <button type="button" onClick={() => wrapErr(connectWeb3AndGetAccounts)}>
        {/* Metamask / Browser */}
        <MetamaskIcon className={styles.metamask} width={25} /> Web3 Wallet
      </button>
      <button type="button" onClick={() => wrapErr(open)}>
        <VscJson className={styles.jsonIcon} />
        Import from JSON
      </button>
      <input {...getInputProps()} />
    </>
  )

  if (!relayerURL) {
    return (
      <div className={cn(styles.loginSignupWrapper, styles[theme])}>
        <AmbireLogo className={styles.logo} />
        <section className={styles.addAccount}>
          <div className={styles.loginOthers}>
            <h3>Proceed with:</h3>
            {addFromSignerButtons}
            <h3>NOTE: You can enable email/password login by connecting to a relayer.</h3>
            {addAccErr ? (
              <p className={styles.error} style={{ maxWidth: '800px' }}>
                {addAccErr}
              </p>
            ) : null}
          </div>
        </section>
      </div>
    )
  }
  // TODO: Would be great to create Ambire spinners(like 1inch but simpler) (I can have a look at them if you need)
  return (
    <div className={cn(styles.loginSignupWrapper, styles[theme])}>
      {requiresEmailConfFor ? (
        <>
          <div className={styles.logo} />
          <div className={`${styles.emailConf}`}>
            <Lottie
              className={styles.emailAnimation}
              animationData={AnimationData}
              background="transparent"
              speed="1"
              loop
              autoplay
            />
            <h3>Email confirmation required</h3>
            <p className={styles.emailConfText}>
              We sent an email to{' '}
              <span className={styles.email}>
                {isCreateRespCompleted && isCreateRespCompleted[0].email}
              </span>
              .
              <br />
              Please check your inbox for &quot;Welcome to
              <br />
              Ambire Wallet&quot; email and click &quot;Verify&quot;.
            </p>

            <button type="button" className={styles.backButton} onClick={handleBackBtnClicked}>
              <ChevronLeftIcon /> Back to Register
            </button>
          </div>
        </>
      ) : (
        <>
          {pluginData ? (
            <img src={pluginData.iconUrl} alt="plugin logo" className={styles.logo} />
          ) : (
            <AmbireLogo className={styles.logo} />
          )}
          {pluginData && (
            <div className={styles.pluginInfo}>
              <div className={styles.name}>{pluginData.name}</div>
              <div>{pluginData.description}</div>
            </div>
          )}
          <section className={styles.addAccount}>
            <div className={styles.loginOthers}>
              <h3 style={{ textAlign: 'center' }}>Proceed with:</h3>
              {inProgress !== 'hwwallet' ? (
                <>
                  <Link to="/email-register">
                    <button type="button">
                      <EmailIcon className={styles.email} />
                      Email
                    </button>
                  </Link>
                  {addFromSignerButtons}
                  {addAccErr ? <p className={styles.error}>{addAccErr}</p> : null}
                </>
              ) : (
                <div className={styles.accountLoader}>
                  <Loading />
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
