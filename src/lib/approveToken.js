import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { constants, Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { getProvider } from './provider'

const ERC20Interface = new Interface(ERC20ABI)

const approveToken = async (scope, networkId, accountId, address, tokenAddress, addRequestTxn, addToast, bigNumberHexAmount = constants.MaxUint256) => {
    try {
        const prefixId = scope.toLowerCase().replace(/' '/g, '_')
        const provider = getProvider(networkId)
        const tokenContract = new Contract(tokenAddress, ERC20Interface, provider)
        const allowance = await tokenContract.allowance(accountId, address)

        if (allowance.lt(bigNumberHexAmount)) {
            addRequestTxn(`${prefixId}_approve_${Date.now()}`, {
                to: tokenAddress,
                value: '0x0',
                data: ERC20Interface.encodeFunctionData('approve', [address, bigNumberHexAmount])
            })
        }
    } catch(e) {
        console.error(e)
        addToast(`${scope} Approve Error: ${e.message || e}`, { error: true })
    }
}

export default approveToken