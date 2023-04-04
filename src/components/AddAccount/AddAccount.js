import cn from 'classnames'
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import LoginOrSignup from 'components/LoginOrSignupForm/LoginOrSignupForm'
import TrezorConnect from '@trezor/connect-web'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { hexZeroPad, AbiCoder, keccak256, id, getAddress } from 'ethers/lib/utils'
import { Wallet } from 'ethers'
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
import { validateImportedAccountProps, fileSizeValidator } from 'lib/validations/importedAccountValidations'
import LatticeModal from 'components/Modals/LatticeModal/LatticeModal'
import Lottie from 'lottie-react'
import AnimationData from './assets/confirm-email.json'

import { useThemeContext } from 'context/ThemeProvider/ThemeProvider'

import styles from './AddAccount.module.scss'
// Icons
import { ReactComponent as AmbireLogo } from 'resources/logo.svg'
import { AiOutlineReload } from 'react-icons/ai'
import { ReactComponent as ChevronLeftIcon } from 'resources/icons/chevron-left.svg'
import { ReactComponent as TrezorIcon } from 'resources/providers/trezor.svg'
import { ReactComponent as LedgerIcon } from 'resources/providers/ledger.svg'
import { ReactComponent as GridPlusIcon } from 'resources/providers/grid-plus.svg'
import { ReactComponent as MetamaskIcon } from 'resources/providers/metamask-fox.svg'
import { ReactComponent as EmailIcon } from 'resources/icons/email.svg'

TrezorConnect.manifest({
  email: 'contactus@ambire.com',
  appUrl: 'https://wallet.ambire.com'
})

const EMAIL_AND_TIMER_REFRESH_TIME = 5000
const RESEND_EMAIL_TIMER_INITIAL = 60000

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
  const [resendTimeLeft, setResendTimeLeft] = useState(null)
  const [isEmailResent, setEmailResent] = useState(false)
  const [isEmailConfirmed, setEmailConfirmed] = useState(false)

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

  const wrapErr = async fn => {
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

  const createQuickAcc = async (req) => {
    setErr('')

    // async hack to let React run a tick so it can re-render before the blocking Wallet.createRandom()
    await new Promise(resolve => setTimeout(resolve, 0))

    const extraEntropy = id(req.email + ':' + Date.now() + ':' + Math.random() + ':' + (typeof performance === 'object' && performance.now()))
    const firstKeyWallet = Wallet.createRandom({ extraEntropy })
    // 6 words is 2048**6
    const secondKeySecret = Wallet.createRandom({ extraEntropy }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email

    const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
    if (!secondKeyResp.address) throw new Error(`second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`)

    const { salt, baseIdentityAddr, identityFactoryAddr, quickAccManager, quickAccTimelock } = accountPresets
    const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
    const signer = {
      quickAccManager,
      timelock: quickAccountTuple[0],
      one: quickAccountTuple[1],
      two: quickAccountTuple[2]
    }
    const abiCoder = new AbiCoder()
    const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
    const privileges = [[quickAccManager, accHash]]
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress('0x' + generateAddress2(
      // Converting to buffer is required in ethereumjs-util version: 7.1.3
      Buffer.from(identityFactoryAddr.slice(2), 'hex'),
      Buffer.from(salt.slice(2), 'hex'),
      Buffer.from(bytecode.slice(2), 'hex')
    ).toString('hex'))
    const primaryKeyBackup = JSON.stringify(
      await firstKeyWallet.encrypt(req.passphrase, accountPresets.encryptionOpts)
    )

    const utm = utmTracking.getLatestUtmData()

    const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
      email: req.email,
      primaryKeyBackup: req.backupOptout ? undefined : primaryKeyBackup,
      secondKeySecret,
      salt, identityFactoryAddr, baseIdentityAddr,
      privileges,
      quickAccSigner: signer,
      ...(utm.length && { utm })
    })
    
    if (createResp.success) {
      utmTracking.resetUtm()
    } 
    if (createResp.message === 'EMAIL_ALREADY_USED') {
      setErr('An account with this email already exists')
      return
    }
    if (!createResp.success) {
      console.log(createResp)
      setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
      return
    }

    setIsCreateRespCompleted([{
      id: identityAddr,
      email: req.email,
      primaryKeyBackup,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer,
      cloudBackupOptout: !!req.backupOptout,
      // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
      backupOptout: !!req.backupOptout,
      // This makes the modal appear, and will be removed by the modal which will call onAddAccount to update it
      emailConfRequired: true
    }, { select: true, isNew: true }])
    
    setRequiresConfFor(true)
    setResendTimeLeft(RESEND_EMAIL_TIMER_INITIAL)
  }

  const checkEmailConfirmation = useCallback(async () => {
    if (!isCreateRespCompleted) return
    const relayerIdentityURL = `${relayerURL}/identity/${isCreateRespCompleted[0].id}`
    try {
      const identity = await fetchGet(relayerIdentityURL)
      if (identity) {
          const { emailConfirmed } = identity.meta
          const isConfirmed = !!emailConfirmed
          setEmailConfirmed(isConfirmed)
          if (isConfirmed) {
            setRequiresConfFor(!isConfirmed)
            onAddAccount({
                ...isCreateRespCompleted[0],
                emailConfRequired: false
            }, isCreateRespCompleted[1])
          }
      }
  } catch(e) {
      console.error(e);
      addToast('Could not check email confirmation.', { error: true })
  }
  }, [addToast, isCreateRespCompleted, onAddAccount, relayerURL])

  useEffect(() => {
    if (requiresEmailConfFor) {
      const timer = setTimeout(async () => {
        await checkEmailConfirmation()
      }, EMAIL_AND_TIMER_REFRESH_TIME)
      return () => clearTimeout(timer)
    }
  })

  const sendConfirmationEmail = async () => {
    try {
        const response = await fetchGet(`${relayerURL}/identity/${(isCreateRespCompleted.length > 0) && isCreateRespCompleted[0].id}/resend-verification-email`)
        if (!response.success) throw new Error('Relayer did not return success.')

        addToast('Verification email sent!')
        setEmailResent(true)
    } catch(e) {
        console.error(e)
        addToast('Could not resend verification email.' + e.message || e, { error: true })
        setEmailResent(false)
    }
  }
 
  useEffect(() => {
    if (resendTimeLeft) {
      const resendInterval = setInterval(() => setResendTimeLeft(resendTimeLeft => resendTimeLeft > 0 ? resendTimeLeft - EMAIL_AND_TIMER_REFRESH_TIME : 0), EMAIL_AND_TIMER_REFRESH_TIME)
      return () => clearTimeout(resendInterval)
    }
  })

  // EOA implementations
  // Add or create accounts from Trezor/Ledger/Metamask/etc.
  const createFromEOA = useCallback(async (addr, signerType) => {
    const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
    const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
    const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
    const identityAddr = getAddress('0x' + generateAddress2(
      // Converting to buffer is required in ethereumjs-util version: 7.1.3
      Buffer.from(identityFactoryAddr.slice(2), 'hex'),
      Buffer.from(salt.slice(2), 'hex'),
      Buffer.from(bytecode.slice(2), 'hex')
    ).toString('hex'))

    const utm = utmTracking.getLatestUtmData()

    if (relayerURL) {
      const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
        salt, identityFactoryAddr, baseIdentityAddr,
        privileges,
        signerType,
        ...(utm.length && { utm })
      })
      if (createResp.success) {
        utmTracking.resetUtm()
      }
      if (!createResp.success && !(createResp.message && createResp.message.includes('already exists'))) throw createResp
    }

    return {
      id: identityAddr,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer: { address: getAddress(addr) }
    }
  }, [relayerURL, utmTracking])

  async function connectWeb3AndGetAccounts() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not available')
    }
    const ethereum = window.ethereum

    const permissions = await ethereum.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
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
    const addresses = accountsPermission.caveats.find(caveat => caveat.type ==='restrictReturnedAccounts' || caveat.name === 'exposedAccounts').value

    if (addresses.length === 1) return onEOASelected(addresses[0], {type: 'Web3'})

    setChooseSigners({ addresses, signerName: 'Web3' })
  }

  const getAccountByAddr = useCallback(async (idAddr, signerAddr) => {
    // In principle, we need these values to be able to operate in relayerless mode,
    // so we just store them in all cases
    // Plus, in the future this call may be used to retrieve other things
    const { salt, identityFactoryAddr, baseIdentityAddr, bytecode } = await fetch(`${relayerURL}/identity/${idAddr}`)
      .then(r => r.json())
    if (!(salt && identityFactoryAddr && baseIdentityAddr && bytecode)) throw new Error(`Incomplete data from relayer for ${idAddr}`)
    return {
      id: idAddr,
      salt, identityFactoryAddr, baseIdentityAddr, bytecode,
      signer: { address: signerAddr }
    }
  }, [relayerURL])

  const getOwnedByEOAs = useCallback(async (eoas) => {
    let allUniqueOwned = {}

    await Promise.all(eoas.map(
      async signerAddr => {
        const resp = await fetch(`${relayerURL}/identity/any/by-owner/${signerAddr}?includeFormerlyOwned=true`)
        const privEntries = Object.entries(await resp.json())
        // discard the privileges value, we do not need it as we wanna add all accounts EVER owned by this eoa
        privEntries.forEach(([id, _]) => allUniqueOwned[id] = getAddress(signerAddr))
      }
    ))

    return await Promise.all(
      Object.entries(allUniqueOwned).map(([id, signer]) => getAccountByAddr(id, signer))
    )
  }, [getAccountByAddr, relayerURL])

  const getGridPlusAddresses = ({ addresses, deviceId, commKey, isPaired }) => {
    setChooseSigners({
      addresses, signerName: 'Lattice', signerExtra: {
        type: 'Lattice', deviceId, commKey, isPaired
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
      addresses, signerName: 'Trezor', signerExtra: {
        type: 'trezor',
        info: JSON.parse(JSON.stringify(provider._initialDerivedKeyInfo))
      }
    })
  }

  async function connectLedgerAndGetAccounts() {
    if (isFirefox()) {
      await connectLedgerAndGetAccountsU2F()
    } else {
      await connectLedgerAndGetAccountsWebHID()
    }
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
    const signerExtra = await provider._initialDerivedKeyInfoAsync().then(info => ({
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

  const onEOASelected = useCallback(async (addr, signerExtra) => {
    const addAccount = (acc, opts) => onAddAccount({ ...acc, signerExtra }, opts)
    // when there is no relayer, we can only add the 'default' account created from that EOA
    // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
    //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
    if (!relayerURL) return addAccount(await createFromEOA(addr, signerExtra.type), { select: true })
    // otherwise check which accs we already own and add them
    const owned = await getOwnedByEOAs([addr])
    if (!owned.length) {
        addAccount(await createFromEOA(addr, signerExtra.type), { select: true, isNew: true })
    } else {
      addToast(`Found ${owned.length} existing accounts with signer ${addr}`, { timeout: 15000 })
      owned.forEach((acc, i) => addAccount(acc, { select: i === 0 }))
    }
  }, [addToast, createFromEOA, getOwnedByEOAs, onAddAccount, relayerURL])

  const onSignerAddressClicked = useCallback(val => {
    wrapErr(() => onEOASelected(val.address, signersToChoose.signerExtra))
    setChooseSigners(null)
  }, [onEOASelected, signersToChoose])

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
          isCloseBtnShown={true}
          onCloseBtnClicked={handleSelectSignerAccountModalCloseClicked}
        />
      )
    }
  }, [handleSelectSignerAccountModalCloseClicked, onSignerAddressClicked, showModal, signersToChoose])
  
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
  const addFromSignerButtons = (<>
    <button onClick={() => wrapProgress(connectTrezorAndGetAccounts, 'hwwallet')}>
      {/* Trezor */}
      <TrezorIcon />
    </button>
    <button onClick={() => wrapProgress(connectLedgerAndGetAccounts, 'hwwallet')}>
      {/* Ledger */}
      <LedgerIcon />
    </button>
    <button onClick={() => wrapProgress(connectGridPlusAndGetAccounts, 'hwwallet')}>
      {/* Grid+ Lattice1 */}
      <GridPlusIcon className={styles.gridplus} />
    </button>
    <button onClick={() => wrapErr(connectWeb3AndGetAccounts)}>
      {/* Metamask / Browser */}
      <MetamaskIcon className={styles.metamask} width={25} /> Web3 Wallet
    </button>
    <button onClick={() => wrapErr(open)}>
      <VscJson className={styles.jsonIcon} />
      Import from JSON
    </button>
    <input {...getInputProps()} />
  </>)

  if (!relayerURL) {
    return (<div className={cn(styles.loginSignupWrapper, styles[theme])}>
      <AmbireLogo className={styles.logo} />
      <section className={styles.addAccount}>
        <div className={styles.loginOthers}>
          <h3>Add an account</h3>
          {addFromSignerButtons}
          <h3>NOTE: You can enable email/password login by connecting to a relayer.</h3>
          {addAccErr ? (<p className={styles.error} style={{maxWidth: '800px'}}>{addAccErr}</p>) : (<></>)}
        </div>
      </section>
    </div>)
  }
  //TODO: Would be great to create Ambire spinners(like 1inch but simpler) (I can have a look at them if you need)
  return (<div className={cn(styles.loginSignupWrapper, styles[theme])}>
      { requiresEmailConfFor ?
        (<> 
          <div className={styles.logo} />
          <div className={`${styles.emailConf}`}>
            <Lottie className={styles.emailAnimation} animationData={AnimationData} background="transparent" speed="1" loop autoplay />
            <h3>
              Email confirmation required
            </h3>
            <p className={styles.emailConfText}>
              We sent an email to
              {' '}
              <span className={styles.email}>
                {isCreateRespCompleted && isCreateRespCompleted[0].email}
              </span>
              .
              <br />
              Please check your inbox for "Welcome to
              <br />
              Ambire Wallet" email and click "Verify".
            </p>
            {err ? (<p className={styles.error}>{err}</p>) : (<></>)}
            <div className={styles.btnWrapper}>
              {!isEmailConfirmed && !isEmailResent && <ToolTip label={`Will be available in ${resendTimeLeft / 1000} seconds`} disabled={resendTimeLeft === 0}>
                  <Button border mini icon={<AiOutlineReload/>} disabled={resendTimeLeft !== 0} onClick={sendConfirmationEmail}>Resend</Button>
              </ToolTip>}
            </div>
            <div className={styles.backButton} onClick={handleBackBtnClicked}>
              <ChevronLeftIcon />
              {' '}
              Back to Register
            </div>
          </div>
        </>)
      : (<>
          {pluginData ? <img src={pluginData.iconUrl} alt="plugin logo" className={styles.logo} /> : <AmbireLogo className={styles.logo} />}
          {pluginData &&
            <div className={styles.pluginInfo}>
              <div className={styles.name}>{pluginData.name}</div>
              <div>{pluginData.description}</div>
            </div>
          }
          <section className={styles.addAccount}>
            <div className={styles.loginEmail}>
              <h3>Create a new account</h3>
              <LoginOrSignup
                inProgress={inProgress === 'email'}
                onAccRequest={req => wrapProgress(() => createQuickAcc(req), 'email')}
                action="SIGNUP"
              ></LoginOrSignup>
              {err ? (<p className={styles.error}>{err}</p>) : (<></>)}
            </div>

            <div className={styles.loginSeparator} />
            <div className={styles.loginOthers}>
              <h3>Add an account</h3>
              {inProgress !== 'hwwallet' ? (<>
                <Link to="/email-login">
                  <button>
                    <EmailIcon className={styles.email} />
                    Email login
                  </button>
                </Link>
                {addFromSignerButtons}
                {addAccErr ? (<p className={styles.error}>{addAccErr}</p>) : (<></>)}
              </>) : (<div className={styles.accountLoader}>
                <Loading/>
              </div>)}
            </div>
          </section>
        </>)
      }
    </div>
  )
}
