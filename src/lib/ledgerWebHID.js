import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import AppEth from '@ledgerhq/hw-app-eth'
import { serialize } from '@ethersproject/transactions'
import { addressOfHDKey, DEFAULT_DERIVATION_PATH } from 'lib/ledgerUtils'

const EIP_155_CONSTANT = 35

const HDNode = require('hdkey')

let connectedDevices = null


async function getTransport() {
  connectedDevices = await TransportWebHID.list()
  if (connectedDevices.length) {
    if (connectedDevices[0].opened) {
      return new TransportWebHID(connectedDevices[0])
    } else { // when transport is still not closed and time between 2 requests is short
      return TransportWebHID.open(connectedDevices[0])
    }
  } else {
    try {
      return await TransportWebHID.request()
    } catch (e) {
      if (e.message.includes('reading \'open\'')) {
        throw new Error('ledger WebHID request denied')
      }
      throw new Error('Could not request WebHID ledger: ' + e.message)
    }
  }
}

export async function ledgerGetAddresses(derivationPath = DEFAULT_DERIVATION_PATH, count=1) {
  const transport = await getTransport()
  const accounts = await getAccounts(transport, derivationPath, count)
  transport.close()

  return accounts.map(a => a.address)
}

// WARNING: don't use this with derivation paths like Ledge Live, if you want to compute addresses in JS. LedgerLive increments in the middle of the path, but above all, we can't derive hardened nodes
async function getAccounts(transport, derivationPath = DEFAULT_DERIVATION_PATH, accountsCount=1) {

  // We should expect last child to be non hardened, otherwise it might lead to unexpected path
  const parent = derivationPath.endsWith("'") ? derivationPath : derivationPath.split('/').slice(0, -1).join('/')
  const child = derivationPath.endsWith("'") ? 0 : derivationPath.split('/').slice(-1)[0] * 1

  const ledgerResponse = await getAddressInternal(transport, parent)

  const hdKey = new HDNode()
  hdKey.publicKey = Buffer.from(ledgerResponse.publicKey, 'hex')
  hdKey.chainCode = Buffer.from(ledgerResponse.chainCode, 'hex')
  const mainAddress = addressOfHDKey(hdKey)

  const initialDerivedKeyInfo = {
    hdKey,
    address: mainAddress,
    derivationPath: parent,
    baseDerivationPath: parent,
  }

  // It is not possible to get ledger live addresses by deriving, as the changing index in LedgerLive is hardened
  return calculateDerivedHDKeyInfos(initialDerivedKeyInfo, child, accountsCount)
}


async function getAddressInternal(transport, parentKeyDerivationPath) {
  let timeoutHandle
  const appEth = new AppEth(transport)

  const ledgerTimeout = new Promise((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      return reject(new Error('Device took too long to respond...'))
    }, 10000)
  })

  return Promise.race([
    appEth.getAddress(parentKeyDerivationPath, false, true),
    ledgerTimeout
  ]).then((res) => {
    clearTimeout(timeoutHandle)
    return res
  }).catch(err => {
      if (err.statusCode === 25871 || err.statusCode === 27404) {
        throw Error('Please make sure your ledger is unlocked and running the Ethereum app. ' + err.message)
      } else {
        throw Error('Could not get address from ledger : ' + err)
      }
    })
}

export async function ledgerSignTransaction(txn, chainId, derivationPath = DEFAULT_DERIVATION_PATH) {

  const transport = await getTransport()

  const fromAddr = txn.from

  const unsignedTxObj = {
    ...txn,
    gasLimit: txn.gasLimit || txn.gas,
    chainId: chainId
  }
  delete unsignedTxObj.from
  delete unsignedTxObj.gas

  let serializedUnsigned = serialize(unsignedTxObj)
  const accountsData = await getAccounts(transport, derivationPath, 1)

  const address = accountsData[0].address

  let serializedSigned
  if (address.toLowerCase() === fromAddr.toLowerCase()) {
    let rsvResponse
    try {
      rsvResponse = await new AppEth(transport).signTransaction(accountsData[0].derivationPath, serializedUnsigned.substr(2))
    } catch (e) {
      throw new Error('Could not sign transaction ' + e)
    }

    const intV = parseInt(rsvResponse.v, 16)
    const signedChainId = Math.floor((intV - EIP_155_CONSTANT) / 2)

    if (signedChainId !== chainId) {
      throw new Error('Invalid returned V 0x' + rsvResponse.v)
    }

    delete unsignedTxObj.v
    serializedSigned = serialize(unsignedTxObj, {
      r: '0x' + rsvResponse.r,
      s: '0x' + rsvResponse.s,
      v: intV
    })
  } else {
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }

  transport.close()

  return serializedSigned
}

export async function ledgerSignMessage(hash, signerAddress, derivationPath = DEFAULT_DERIVATION_PATH) {
  const transport = await getTransport()

  const accountsData = await getAccounts(transport, derivationPath, 1)

  const account = accountsData[0]

  let signedMsg
  if (account.address.toLowerCase() === signerAddress.toLowerCase()) {
    try {
      const rsvReply = await new AppEth(transport).signPersonalMessage(derivationPath, hash.substr(2))
      signedMsg = '0x' + rsvReply.r + rsvReply.s + rsvReply.v.toString(16)
    } catch (e) {
      throw new Error('Signature denied ' + e.message)
    }
  } else {
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }
  transport.close()
  return signedMsg
}

export async function ledgerSignMessage712(domainSeparator, hashStructMessage, signerAddress, derivationPath = DEFAULT_DERIVATION_PATH) {
  const transport = await getTransport()

  const accountsData = await getAccounts(transport, derivationPath, 1)

  const account = accountsData[0]

  let signedMsg
  if (account.address.toLowerCase() === signerAddress.toLowerCase()) {
    try {
      const rsvReply = await new AppEth(transport).signEIP712HashedMessage(account.derivationPath, domainSeparator, hashStructMessage)
      signedMsg = '0x' + rsvReply.r + rsvReply.s + rsvReply.v.toString(16)
    } catch (e) {
      throw new Error('Signature denied ' + e.message)
    }
  } else {
    throw new Error('Incorrect address. Are you using the correct account/ledger?')
  }
  transport.close()
  return signedMsg
}

// Might use it in the future to calc non Ledger live addresses
export function calculateDerivedHDKeyInfos(initialDerivedKeyInfo, index, count) {
  const derivedKeys = []
  for (let i = index; i < index + count; i++) {
    const fullDerivationPath = initialDerivedKeyInfo.baseDerivationPath
    const hdKey = initialDerivedKeyInfo.hdKey.deriveChild(i)
    const address = addressOfHDKey(hdKey)
    const derivedKey = {
      address,
      hdKey,
      baseDerivationPath: initialDerivedKeyInfo.baseDerivationPath,
      derivationPath: fullDerivationPath,
    }

    derivedKeys.push(derivedKey)
  }
  return derivedKeys
}

