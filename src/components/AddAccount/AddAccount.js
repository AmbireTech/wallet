import './AddAccount.scss'

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import LoginOrSignup from '../LoginOrSignupForm/LoginOrSignupForm'
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { hexZeroPad, AbiCoder, keccak256, id, getAddress } from 'ethers/lib/utils'
import { Wallet } from 'ethers'
import { generateAddress2 } from 'ethereumjs-util'
import { getProxyDeployBytecode } from 'adex-protocol-eth/js/IdentityProxyDeploy'
import { fetch, fetchPost } from '../../lib/fetch'
import accountPresets from '../../consts/accountPresets'
import { useToasts } from '../../hooks/toasts'
import { SelectSignerAccountModal } from '../Modals'
import { useModals } from '../../hooks'

TrezorConnect.manifest({
  email: 'contactus@ambire.com',
  appUrl: 'https://www.ambire.com'
})

// NOTE: This is a compromise, but we can afford it cause QuickAccs require a secondary key
// Consider more
const SCRYPT_ITERATIONS = 131072/8

export default function AddAccount ({ relayerURL, onAddAccount }) {
    const [signersToChoose, setChooseSigners] = useState(null)
    const [err, setErr] = useState('')
    const [addAccErr, setAddAccErr] = useState('')
    const [inProgress, setInProgress] = useState(false)
    const { addToast } = useToasts()
    const { showModal, deactivateBackdrop } = useModals()

    const wrapProgress = async fn => {
        setInProgress(true)
        try {
            await fn()
        } catch(e) {
            console.error(e)
            setAddAccErr(`Unexpected error: ${e.message || e}`)
        }
        setInProgress(false)
    }

    const wrapErr = async fn => {
        setAddAccErr('')
        try {
            await fn()
        } catch(e) {
            console.error(e)
            setAddAccErr(`Unexpected error: ${e.message || e}`)
        }
    }

    const createQuickAcc = async (req) => {
        setErr('')

        // async hack to let React run a tick so it can re-render before the blocking Wallet.createRandom()
        await new Promise(resolve => setTimeout(resolve, 0))

        const extraEntropy = id(req.email+':'+Date.now()+':'+Math.random()+':'+(typeof performance === 'object' && performance.now()))
        const firstKeyWallet = Wallet.createRandom({ extraEntropy })
        // 6 words is 2048**6
        const secondKeySecret = Wallet.createRandom({ extraEntropy }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email

        const secondKeyResp = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
        if (!secondKeyResp.address) throw new Error(`second-key returned no address, error: ${secondKeyResp.message || secondKeyResp}`)

        const { salt, baseIdentityAddr, identityFactoryAddr, quickAccManager, quickAccTimelock } = accountPresets
        const quickAccountTuple = [quickAccTimelock, firstKeyWallet.address, secondKeyResp.address]
        const signer = { quickAccManager, timelock: quickAccountTuple[0], one: quickAccountTuple[1], two: quickAccountTuple[2] }
        const abiCoder = new AbiCoder()
        const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccountTuple]))
        const privileges = [[quickAccManager, accHash]]
        const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
        const identityAddr = getAddress('0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex'))
        const primaryKeyBackup = JSON.stringify(
            await firstKeyWallet.encrypt(req.passphrase, { scrypt: { N: SCRYPT_ITERATIONS } })
        )

        const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
            email: req.email,
            primaryKeyBackup: req.backupOptout ? null : primaryKeyBackup,
            secondKeySecret,
            salt, identityFactoryAddr, baseIdentityAddr,
            privileges,
            quickAccSigner: signer
        })
        if (createResp.message === 'EMAIL_ALREADY_USED') {
            setErr('An account with this email already exists')
            return
        }
        if (!createResp.success) {
            console.log(createResp)
            setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
            return
        }

        await onAddAccount({
            id: identityAddr,
            email: req.email,
            primaryKeyBackup,
            salt, identityFactoryAddr, baseIdentityAddr, bytecode,
            signer
        }, { select: true })
    }

    // EOA implementations
    // Add or create accounts from Trezor/Ledger/Metamask/etc.
    const createFromEOA = useCallback(async(addr) => {
        const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
        const { salt, baseIdentityAddr, identityFactoryAddr } = accountPresets
        const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
        const identityAddr = getAddress('0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex'))

        if (relayerURL) {
            const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
                salt, identityFactoryAddr, baseIdentityAddr,
                privileges
            })
            if (!createResp.success && !(createResp.message && createResp.message.includes('already exists'))) throw createResp
        }

        return {
            id: identityAddr,
            salt, identityFactoryAddr, baseIdentityAddr, bytecode,
            signer: { address: getAddress(addr) }
        }
    }, [relayerURL])

    async function connectWeb3AndGetAccounts () {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask not available')
        }
        const ethereum = window.ethereum
        const web3Accs = await ethereum.request({ method: 'eth_requestAccounts' })
        if (!web3Accs.length) throw new Error('No accounts connected')
        if (web3Accs.length === 1) return onEOASelected(web3Accs[0])
        
        setChooseSigners({ addresses: web3Accs, signerName: 'Web3' })
    }

    const getAccountByAddr = useCallback(async(idAddr, signerAddr) => {
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

    const getOwnedByEOAs= useCallback(async(eoas) => {
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
 
    async function connectTrezorAndGetAccounts () {
        /*
        const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
        engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
        engine.addProvider(new CacheSubprovider())
        engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
        */
        const provider = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
        const addresses = await provider.getAccountsAsync(50)
        setChooseSigners({ addresses, signerName: 'Trezor', signerExtra: {
            type: 'trezor',
            info: JSON.parse(JSON.stringify(provider._initialDerivedKeyInfo))
        } },)
    }

    async function connectLedgerAndGetAccounts () {
        const provider = new LedgerSubprovider({
            networkId: 0, // @TODO: probably not needed
            ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
            //baseDerivationPath: this.baseDerivationPath
        })
        // NOTE: do not attempt to do both of these together (await Promise.all)
        // there is a bug in the ledger subprovider (race condition), so it will think we're trying to make two connections simultaniously
        // cause one call won't be aware of the other's attempt to connect
        const addresses = await provider.getAccountsAsync(50)
        const signerExtra = await provider._initialDerivedKeyInfoAsync().then(info => ({ type: 'ledger', info: JSON.parse(JSON.stringify(info)) }))
        
        setChooseSigners({ addresses, signerName: 'Ledger', signerExtra })
    }

    const onEOASelected = useCallback(async (addr, signerExtra) => {
        const addAccount = (acc, opts) => onAddAccount({ ...acc, signerExtra }, opts)
        // when there is no relayer, we can only add the 'default' account created from that EOA
        // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
        //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
        if (!relayerURL) return addAccount(await createFromEOA(addr), { select: true })
        // otherwise check which accs we already own and add them
        const owned = await getOwnedByEOAs([addr])
        if (!owned.length) return addAccount(await createFromEOA(addr), { select: true })
        else {
            addToast(`Found ${owned.length} existing accounts with signer ${addr}`, { timeout: 15000 })
            owned.forEach((acc, i) => addAccount(acc , { select: i === 0 }))
        }
    }, [addToast, createFromEOA, getOwnedByEOAs, onAddAccount, relayerURL])

    const onSignerAddressClicked = useCallback(val => {
        wrapErr(() => onEOASelected(val.address, signersToChoose.signerExtra))
        setChooseSigners(null)
    }, [onEOASelected, signersToChoose])

    // The UI for choosing a signer to create/add an account with, for example
    // when connecting a hardware wallet, it has many addrs you can choose from
    useEffect(() => {
        if (signersToChoose) {
            deactivateBackdrop()
            showModal(
                <SelectSignerAccountModal
                    signersToChoose={signersToChoose.addresses}
                    onSignerAddressClicked={onSignerAddressClicked}
                    description={`Signer address is the ${signersToChoose.signerName} address you will use to sign transactions on Ambire Wallet.
                    А new account will be created using this signer if you don’t have one.`}
                    isCloseBtnShown={false}
                />
            )
        }
    }, [deactivateBackdrop, onSignerAddressClicked, showModal, signersToChoose])

    // Adding accounts from existing signers
    // @TODO: progress indicators for those
    const addFromSignerButtons = (<>
        <button onClick={() => wrapErr(connectTrezorAndGetAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/trezor.png)' }}/>Trezor</button>
        <button onClick={() => wrapErr(connectLedgerAndGetAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/ledger.png)' }}/>Ledger</button>
        <button onClick={() => wrapErr(connectWeb3AndGetAccounts)}><div className="icon" style={{ backgroundImage: 'url(./resources/metamask.png)' }}/>Metamask / Browser</button>
    </>)

  if (!relayerURL) {
        return (<div className="loginSignupWrapper">
            <div id="logo"/>
            <section id="addAccount">
            <div id="loginOthers">
                <h3>Add an account</h3>
                {addFromSignerButtons}
                <h3>NOTE: You can enable email/password login by connecting to a relayer.</h3>
            </div>
            </section>
        </div>)
    }

    return (<div className="loginSignupWrapper">
        <div id="logo"/>
        <section id="addAccount">
          <div id="loginEmail">
            <h3>Create a new account</h3>
            <LoginOrSignup
                inProgress={inProgress}
                onAccRequest={req => wrapProgress(() => createQuickAcc(req))}
                action="SIGNUP"
            ></LoginOrSignup>
            {err ? (<p className="error">{err}</p>) : (<></>)}
          </div>
    
          <div id="loginSeparator">
            <div className="verticalLine"></div>
            <span>or</span>
            <div className="verticalLine"></div>
          </div>
    
          <div id="loginOthers">
            <h3>Add an account</h3>
            <Link to="/email-login">
              <button><div className="icon" style={{ backgroundImage: 'url(./resources/envelope.png)' }}/>Email login</button>
            </Link>
            {addFromSignerButtons}
            {addAccErr ? (<p className="error">{addAccErr}</p>) : (<></>)}
          </div>
        </section>
      </div>
    )
}
