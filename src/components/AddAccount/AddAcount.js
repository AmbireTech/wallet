import { useState } from 'react'
import { Link } from 'react-router-dom'
import LoginOrSignup from '../LoginOrSignupForm/LoginOrSignupForm'
import TrezorConnect from 'trezor-connect'
import { TrezorSubprovider } from '@0x/subproviders/lib/src/subproviders/trezor' // https://github.com/0xProject/0x-monorepo/issues/1400
import { LedgerSubprovider } from '@0x/subproviders/lib/src/subproviders/ledger' // https://github.com/0xProject/0x-monorepo/issues/1400
import { ledgerEthereumBrowserClientFactoryAsync } from '@0x/subproviders/lib/src' // https://github.com/0xProject/0x-monorepo/issues/1400
import { hexZeroPad, AbiCoder, keccak256, id, getAddress } from 'ethers/lib/utils'

import { fetch, fetchPost } from '../../lib/fetch'

// @TODO update those pre-launch
const ACCOUNT_PRESETS = {
    salt: hexZeroPad('0x01', 32),
    baseIdentityAddr: '0xA2E9e41ee85AE792A8213736c7f9398a933F8184',
    identityFactoryAddr: '0x447f228E6af15C2Df147235eCB9ABE53BD1f46Ad'
}

TrezorConnect.manifest({
  email: 'contactus@ambire.com',
  appUrl: 'https://www.ambire.com'
})


// @TODO REFACTOR: use import for these
const { generateAddress2 } = require('ethereumjs-util')
const { getProxyDeployBytecode } = require('adex-protocol-eth/js/IdentityProxyDeploy')
const { Wallet } = require('ethers')

// NOTE: This is a compromise, but we can afford it cause QuickAccs require a secondary key
// Consider more
const SCRYPT_ITERATIONS = 131072/8

export default function AddAccount ({ relayerURL, onAddAccount }) {
    const [signersToChoose, setChooseSigners] = useState(null)
    const [err, setErr] = useState('')
    const [addAccErr, setAddAccErr] = useState('')
    const [inProgress, setInProgress] = useState(false)

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

        const firstKeyWallet = Wallet.createRandom()
        // @TODO fix this hack, use another source of randomness
        // 6 words is 2048**6
        const secondKeySecret = Wallet.createRandom({
            extraEntropy: id(req.email+':'+Date.now())
        }).mnemonic.phrase.split(' ').slice(0, 6).join(' ') + ' ' + req.email

        const secondKeyAddress = await fetchPost(`${relayerURL}/second-key`, { secondKeySecret })
            .then(r => r.address)

        // @TODO: timelock value for the quickAccount
        const quickAccount = [600, firstKeyWallet.address, secondKeyAddress]
        const abiCoder = new AbiCoder()
        const accHash = keccak256(abiCoder.encode(['tuple(uint, address, address)'], [quickAccount]))
        // @TODO not hardcoded
        const quickAccManager = '0x697d866d20a8E8886a0D0511e82846AC108Bc5B6'
        const privileges = [[quickAccManager, accHash]]
        const { salt, baseIdentityAddr, identityFactoryAddr } = ACCOUNT_PRESETS
        const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
        const identityAddr = getAddress('0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex'))

        const primaryKeyBackup = JSON.stringify(
            await firstKeyWallet.encrypt(req.passphrase, { scrypt: { N: SCRYPT_ITERATIONS } })
        )

        // @TODO catch errors here - wrong status codes, etc.
        const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
            email: req.email,
            primaryKeyBackup: req.backupOptout ? null : primaryKeyBackup,
            secondKeySecret,
            salt, identityFactoryAddr, baseIdentityAddr,
            privileges,
        })
        if (createResp.message === 'EMAIL_ALREADY_USED') {
            setErr('Email already used')
            return
        }
        if (!createResp.success) {
            console.log(createResp)
            setErr(`Unexpected sign up error: ${createResp.message || 'unknown'}`)
            return
        }

        await onAddAccount({
            _id: identityAddr,
            email: req.email,
            primaryKeyBackup,
            salt, identityFactoryAddr, baseIdentityAddr,
            // @TODO signer
        }, { select: true })
    }


    // EOA implementations
    // Add or create accounts from Trezor/Ledger/Metamask/etc.

    // @TODO refactor into create with privileges perhaps?
    // only if we can have the whitelisted* stuff in advance; we can hardcode them
    async function createFromEOA (addr) {
        const privileges = [[getAddress(addr), hexZeroPad('0x01', 32)]]
        const { salt, baseIdentityAddr, identityFactoryAddr } = ACCOUNT_PRESETS
        const bytecode = getProxyDeployBytecode(baseIdentityAddr, privileges, { privSlot: 0 })
        const identityAddr = getAddress('0x' + generateAddress2(identityFactoryAddr, salt, bytecode).toString('hex'))

        if (relayerURL) {
            // @TODO catch errors here - wrong status codes, etc.
            const createResp = await fetchPost(`${relayerURL}/identity/${identityAddr}`, {
                salt, identityFactoryAddr, baseIdentityAddr,
                privileges
            })
            if (!createResp.success && !(createResp.message && createResp.message.includes('already exists'))) throw createResp
        }

        return {
            _id: identityAddr,
            salt, identityFactoryAddr, baseIdentityAddr
            // @TODO signer
        }
    }

    async function connectWeb3AndGetAccounts () {
        // @TODO: pending state; should bein the LoginORSignup (AddAccount) component
        if (typeof window.ethereum === 'undefined') {
            // @TODO catch this
            throw new Error('MetaMask not available')
        }
        const ethereum = window.ethereum
        const web3Accs = await ethereum.request({ method: 'eth_requestAccounts' })
        if (!web3Accs.length) throw new Error('No accounts connected')
        const owned = await getOwnedByEOAs(web3Accs)
        if (!owned.length) onAddAccount(await createFromEOA(web3Accs[0]), { select: true })
        else owned.forEach((acc, i) => onAddAccount(acc, { select: i === 0 }))
    }

    async function getOwnedByEOAs(eoas) {
        const allOwnedIdentities = await Promise.all(eoas.map(
            async acc => {
                const resp = await fetch(`${relayerURL}/identity/any/by-owner/${acc}?includeFormerlyOwned=true`)
                return await resp.json()
            }
        ))

        let allUniqueOwned = {}
        // preserve the last truthy priv value
        allOwnedIdentities.forEach(x => 
            Object.entries(x).forEach(
                ([id, priv]) => allUniqueOwned[id] = priv || allUniqueOwned[id]
            )
        )

        return await Promise.all(Object.keys(allUniqueOwned).map(async addr => {
            return { ...(await getAccountByAddr(addr)) /* TODO signer */ }
        }))
    }

    async function getAccountByAddr (addr) {
        // In principle, we need these values to be able to operate in relayerless mode,
        // so we just store them in all cases
        // Plus, in the future this call may be used to retrieve other things
        const { salt, identityFactoryAddr, baseIdentityAddr } = await fetch(`${relayerURL}/identity/${addr}`)
            .then(r => r.json())
        return {
            _id: addr,
            salt, identityFactoryAddr, baseIdentityAddr
        }
    }

    async function connectTrezorAndGetAccounts () {
        /*
        const engine = new Web3ProviderEngine({ pollingInterval: this.pollingInterval })
        engine.addProvider(new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect, ...this.config }))
        engine.addProvider(new CacheSubprovider())
        engine.addProvider(new RPCSubprovider(this.url, this.requestTimeoutMs))
        */
        const provider = new TrezorSubprovider({ trezorConnectClientApi: TrezorConnect })
        setChooseSigners(await provider.getAccountsAsync(50))
    }

    async function connectLedgerAndGetAccounts () {
        const provider = new LedgerSubprovider({
            networkId: 0, // @TODO: is this needed?
            ledgerEthereumClientFactoryAsync: ledgerEthereumBrowserClientFactoryAsync,
            //baseDerivationPath: this.baseDerivationPath
        })
        setChooseSigners(await provider.getAccountsAsync(50))
    }

    async function onEOASelected (addr) {
        // when there is no relayer, we can only add the 'default' account created from that EOA
        // @TODO in the future, it would be nice to do getLogs from the provider here to find out which other addrs we control
        //   ... maybe we can isolate the code for that in lib/relayerless or something like that to not clutter this code
        if (!relayerURL) return onAddAccount(await createFromEOA(addr), { select: true })
        // otherwise check which accs we already own and add them
        const owned = await getOwnedByEOAs([addr])
        if (!owned.length) return onAddAccount(await createFromEOA(addr), { select: true })
        else owned.forEach((acc, i) => onAddAccount(acc, { select: i === 0 }))
    }

    // The UI for choosing a signer to create/add an account with, for example
    // when connecting a hardware wallet, it has many addrs you can choose from
    if (signersToChoose) {
        return (<div className="loginSignupWrapper chooseSigners">
            <h3>Choose a signer</h3>
            <ul id="signersToChoose">
                {signersToChoose.map(addr => (<li key={addr} onClick={() => wrapErr(() => onEOASelected(addr))}>{addr}</li>))}
            </ul>
        </div>)
    }

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
                <h3>NOTE: You can enable email/passphrase login by connecting to a relayer.</h3>
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
              <button><div className="icon" style={{ backgroundImage: 'url(./resources/envelope.png)' }}/>Email</button>
            </Link>
            {addFromSignerButtons}
            {addAccErr ? (<p className="error">{addAccErr}</p>) : (<></>)}
          </div>
        </section>
      </div>
    )
}