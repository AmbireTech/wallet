import TransportWebHID from '@ledgerhq/hw-transport-webhid'
import AppEth from '@ledgerhq/hw-app-eth'
import { serialize } from '@ethersproject/transactions'

const EIP_155_CONSTANT = 35

const ethUtil = require('ethereumjs-util')
const HDNode = require('hdkey')

let connectedDevices = null

export const PARENT_HD_PATH = "44'/60'/0'/0"

async function getTransport() {
  connectedDevices = await TransportWebHID.list()
  if (connectedDevices.length && connectedDevices[0].opened) {
    return new TransportWebHID(connectedDevices[0])
  } else {
    try {
      return await TransportWebHID.request()
    } catch (e) {
      throw new Error('Could not request WebHID ledger')
    }
  }
}


export async function ledgerGetAddresses() {
  const returnData = {
    error: null,
    addresses: []
  }

  const transport = await getTransport().catch(err => {
    returnData.error = err
  })
  if (!transport) return returnData

  const accountsData = await getAccounts(transport)

  transport.close()

  if (accountsData.error) {
    returnData.error = accountsData.error
  } else {
    returnData.addresses = accountsData.accounts.map(a => a.address)
  }

  return returnData
}

async function getAccounts(transport) {
  const parentKeyDerivationPath = `m/${PARENT_HD_PATH}`
  const returnData = {
    error: null,
    accounts: []
  }
  let ledgerResponse
  try {
    ledgerResponse = await getAddressInternal(transport, parentKeyDerivationPath).then(o => o).catch(err => {
      if (err.statusCode === 25871 || err.statusCode === 27404) {
        returnData.error = 'Please make sure your ledger is unlocked and running the Ethereum app. ' + err.message
      } else {
        returnData.error = 'Could not get address from ledger : ' + err
      }
    })
  } catch (e) {
    console.log(e)
  }

  if (!ledgerResponse) {
    return returnData
  }

  const hdKey = new HDNode()
  hdKey.publicKey = Buffer.from(ledgerResponse.publicKey, 'hex')
  hdKey.chainCode = Buffer.from(ledgerResponse.chainCode, 'hex')
  const mainAddress = addressOfHDKey(hdKey)

  const initialDerivedKeyInfo = {
    hdKey,
    address: mainAddress,
    derivationPath: parentKeyDerivationPath,
    baseDerivationPath: PARENT_HD_PATH,
  }

  // currently we can't get addrs to match with what appears in MM/Ledger live so only one is derived
  returnData.accounts = calculateDerivedHDKeyInfos(initialDerivedKeyInfo, 1)
  return returnData
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
  })
}

export async function ledgerSignTransaction(txn, chainId) {
  const transport = await getTransport().catch(err => {
    throw err
  })

  const fromAddr = txn.from

  const unsignedTxObj = {
    ...txn,
    gasLimit: txn.gasLimit || txn.gas,
    chainId: chainId
  }
  delete unsignedTxObj.from
  delete unsignedTxObj.gas

  let serializedUnsigned = serialize(unsignedTxObj)
  const accountsData = await getAccounts(transport)
  if (accountsData.error) {
    throw new Error(accountsData.error)
  }

  //Managing only 1 addr for now
  const address = accountsData.accounts[0].address

  let serializedSigned
  if (address.toLowerCase() === fromAddr.toLowerCase()) {
    let rsvResponse
    try {
      rsvResponse = await new AppEth(transport).signTransaction(accountsData.accounts[0].derivationPath, serializedUnsigned.substr(2))
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

export async function ledgerSignMessage(hash, signerAddress) {
  const transport = await getTransport().catch(err => {
    throw err
  })

  const accountsData = await getAccounts(transport)
  if (accountsData.error) {
    throw new Error(accountsData.error)
  }

  //TODO for multiple accs?
  const account = accountsData.accounts[0]

  let signedMsg
  if (account.address.toLowerCase() === signerAddress.toLowerCase()) {
    try {
      const rsvReply = await new AppEth(transport).signPersonalMessage(account.derivationPath, hash.substr(2))
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

function calculateDerivedHDKeyInfos(initialDerivedKeyInfo, count) {
  const derivedKeys = []
  for (let i = 0; i < count; i++) {

    const fullDerivationPath = `m/${initialDerivedKeyInfo.baseDerivationPath}/${i}`
    const path = `m/${i}`
    const hdKey = initialDerivedKeyInfo.hdKey.derive(path)
    const address = addressOfHDKey(hdKey)
    const derivedKey = {
      address,
      hdKey,
      baseDerivationPath: initialDerivedKeyInfo.baseDerivationPathh,
      derivationPath: fullDerivationPath,
    }

    derivedKeys.push(derivedKey)
  }
  return derivedKeys
}

export function addressOfHDKey(hdKey) {
  const shouldSanitizePublicKey = true
  const derivedPublicKey = hdKey.publicKey
  const ethereumAddressUnprefixed = ethUtil
    .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
    .toString('hex')
  return ethUtil.addHexPrefix(ethereumAddressUnprefixed).toLowerCase()
}
