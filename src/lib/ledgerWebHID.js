import TransportWebHID from "@ledgerhq/hw-transport-webhid"
import AppEth from "@ledgerhq/hw-app-eth"
import {ethers} from "ethers"
import EthTx from 'ethereumjs-tx'
const ethUtil = require("ethereumjs-util");


let connectedDevices = null

const HDPath = "44'/60'/0'/0/0"

export async function ledgerGetAddresses(page, hdPath, t) {
  console.log(`connectLedger`, page, hdPath)
  try {
    let transport
    connectedDevices = await TransportWebHID.list()
    console.log(connectedDevices)
    if (connectedDevices.length && connectedDevices[0].opened) {
      transport = new TransportWebHID(connectedDevices[0])
      //transport = await TransportWebHID.open(connectedDevices[0]);
    } else {
      transport = await TransportWebHID.request()
    }
    console.log(transport)
    debugger
    transport.setDebugMode(true)
    const appEth = new AppEth(transport)
    const address = await appEth.getAddress().then(o => o.address)
    /*console.log(addrData);
    const addresses = [];
    for(let i = 0; i < 10; i++){
        addresses.push()
    }*/
    if (transport) {
      connectedDevices = transport.close()
    }
    return [address]
  } catch (error) {
    throw error
  }
}

export async function ledgerSignTransaction(txn, chainId) {
  console.log(`signTransaction`, txn)
  try {
    let transport
    connectedDevices = await TransportWebHID.list()
    if (connectedDevices.length && connectedDevices[0].opened) {
      transport = new TransportWebHID(connectedDevices[0])
      //transport = await TransportWebHID.open(connectedDevices[0]);
    } else {
      transport = await TransportWebHID.request()
    }

    const unsignedTxObj = {
      ...txn
    }

    delete unsignedTxObj.from
    unsignedTxObj.gasLimit = unsignedTxObj.gas
    delete unsignedTxObj.gas
    unsignedTxObj.chainId = chainId;
    unsignedTxObj.r = "0x0";
    unsignedTxObj.s = "0x0";
    unsignedTxObj.v = "0x" + chainId.toString(16);

    console.log(unsignedTxObj);

    const ethTx = new EthTx(unsignedTxObj)
    const serialized = ethTx.serialize().toString('hex')

    /*const rsTx = await ethers.utils.resolveProperties(unsignedTxObj)
    const serialized = ethers.utils.serializeTransaction(rsTx, {
      r: "0x0",
      s: "0x0",
      v: "0x" + chainId
    }).substr(2)*/

    console.log(serialized)
    debugger;
    const appEth = new AppEth(transport)
    const address = await appEth.getAddress(HDPath).then(o => o.address)

    //const serialized = ethTx.serialize().toString('hex')
    if (address.toLowerCase() === txn.from.toLowerCase()) {
      const rsv = await appEth.signTransaction(HDPath, serialized)
      debugger;

      let v = parseInt(rsv.v, 16);
      console.log(rsv);
      console.log(v);
      const eip55Constant = 35

      const b = ethUtil.toBuffer("0x" + rsv.v);
      console.log(b.toString('hex'));

      const signedChainId = Math.floor((b[0] - eip55Constant) / 2)
      if (signedChainId !== chainId) {
        throw new Error("Too old ledger firmware?")
      }


      console.log(rsv)
      const signedTxObj = {
        ...txn,
        r: "0x" + rsv.r,
        s: "0x" + rsv.s,
        v: rsv.v,
      }
      console.log(signedTxObj)
      const signedTx = new EthTx(signedTxObj)
      return "0x" + signedTx.serialize().toString('hex')
    }
    if (transport) {
      connectedDevices = transport.close()
    }
  } catch (error) {
    throw error
  }
}

export async function ledgerSignMessage(hash, signerAddress) {
  console.log(`signMessage`, hash)
  try {
    let transport
    connectedDevices = await TransportWebHID.list()
    console.log(connectedDevices)
    if (connectedDevices.length && connectedDevices[0].opened) {
      transport = new TransportWebHID(connectedDevices[0])
      //transport = await TransportWebHID.open(connectedDevices[0]);
    } else {
      transport = await TransportWebHID.request()
    }
    console.log(transport)
    transport.setDebugMode(true)
    const appEth = new AppEth(transport)
    const address = await appEth.getAddress(HDPath).then(o => o.address)

    if (address.toLowerCase() === signerAddress.toLowerCase()) {
      const rsv = await appEth.signPersonalMessage(HDPath, hash.substr(2))
      return "0x" + rsv.r + rsv.s + rsv.v.toString(16)
    }
    if (transport) {
      connectedDevices = transport.close()
    }
  } catch (error) {
    throw error
  }
}
