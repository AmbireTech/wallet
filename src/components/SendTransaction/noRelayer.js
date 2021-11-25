import { Interface, hexlify } from 'ethers/lib/utils'
const IdentityInterface = new Interface(require('adex-protocol-eth/abi/Identity5.2'))
const FactoryInterface = new Interface(require('adex-protocol-eth/abi/IdentityFactory5.2'))

export async function sendNoRelayer ({ finalBundle, account, network, wallet, estimation, feeSpeed, provider }) {
    const { signer } = finalBundle
    // @TODO: in case we need deploying, run using deployAndCall pipeline with signed msgs
    // @TODO: quickAccManager
    if (signer.quickAccManager) throw new Error('quickAccManager not supported in relayerless mode yet')
    // currently disabled quickAccManager cause 1) we don't have a means of getting the second sig 2) we still have to sign txes so it's inconvenient
    // if (signer.quickAccManager) await finalBundle.sign(wallet)
    //const [to, data] = signer.quickAccManager ? [signer.quickAccManager, QuickAccManagerInterface.encodeFunctionData('send', [finalBundle.identity, [signer.timelock, signer.one, signer.two], [false, finalBundle.signature, '0x']])] :

    // NOTE: just adding values to gasLimit is bad because 1) they're hardcoded estimates
    // and 2) the fee displayed in the UI does not reflect that
    const isDeployed = await provider.getCode(finalBundle.identity).then(code => code !== '0x')
    let gasLimit
    let to, data
    if (isDeployed) {
      gasLimit = estimation.gasLimit + 20000
      to = finalBundle.identity
      data = IdentityInterface.encodeFunctionData('executeBySender', [finalBundle.txns])
    } else {
      await finalBundle.getNonce(provider)
      // just some hardcoded value to make the signing pass
      finalBundle.gasLimit = 400000
      await finalBundle.sign(wallet)
      to = account.identityFactoryAddr
      data = FactoryInterface.encodeFunctionData('deployAndExecute', [account.bytecode, account.salt, finalBundle.txns, finalBundle.signature])
      gasLimit = (await provider.estimateGas({ to, data, from: signer.address })).toNumber() + 20000
    }

    const txn = {
      from: signer.address,
      to, data,
      gas: hexlify(gasLimit),
      gasPrice: hexlify(Math.floor(estimation.feeInNative[feeSpeed] / estimation.gasLimit * 1e18)),
      nonce: hexlify(await provider.getTransactionCount(signer.address))
    }
    try {
      let txId
      if (!wallet.sendTransaction) {
        // HW wallets which only sign
        const signed = await wallet.signTransaction(txn)
        txId = (await provider.sendTransaction(signed)).hash
      } else {
        // web3 injectors which can't sign, but can sign+send
        // they also don't like the gas arg they fully control the chain ID
        const { chainId } = await wallet.provider.getNetwork()
        if (network.chainId !== chainId) throw new Error(`Connected to the wrong network: please switch to ${network.name}`)
        txId = (await wallet.sendTransaction({ from: txn.from, to: txn.to, data: txn.data, gasPrice: txn.gasPrice, nonce: txn.nonce })).hash
      }
      return { success: true, txId }
    } catch(e) {
      if (e.code === 'INSUFFICIENT_FUNDS') throw new Error(`Insufficient gas fees: you need to have ${network.nativeAssetSymbol} on ${signer.address}`)
      throw e
    }
  }
