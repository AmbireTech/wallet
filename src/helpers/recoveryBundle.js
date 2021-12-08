import { Bundle } from 'adex-protocol-eth'
import { Interface } from 'ethers/lib/utils'
import accountPresets from '../consts/accountPresets'

const IDENTITY_INTERFACE = new Interface(require('adex-protocol-eth/abi/Identity5.2'))
const { quickAccManager } = accountPresets

const buildRecoveryBundle = (identity, network, signer, newQuickAccHash) => {
    const recoveryBundle = new Bundle({
        identity,
        network,
        signer,
        txns: [[
            identity,
            '0x00',
            IDENTITY_INTERFACE.encodeFunctionData('setAddrPrivilege', [
                quickAccManager,
                newQuickAccHash,
            ]),
        ]]
    })
    recoveryBundle.recoveryMode = true

    return recoveryBundle
}

export default buildRecoveryBundle