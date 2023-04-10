import { ethers } from 'ethers'

/**
 * Produce EIP6492 signature for Predeploy Contracts
 *
 * More info: https://eips.ethereum.org/EIPS/eip-6492
 *
 * @param {string} signature - origin ERC-1271 signature
 * @param {string} bytecode - account bytecode
 * @returns {string} - EIP6492 signature
 */
export const produceSignature = (signature, bytecode) => {
    // IdentityFactory
    const create2FactoryAddress = '0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA'
    const salt = '0x0000000000000000000000000000000000000000000000000000000000000001'

    // EIP6492 signature ends in magicBytes, which ends with a 0x92,
    // which makes it is impossible for it to collide with a valid ecrecover signature if packed in the r,s,v format,
    // as 0x92 is not a valid value for v.
    const magicBytes = '6492649264926492649264926492649264926492649264926492649264926492'

    const ABI = ['function deploy(bytes code, uint256 salt)']
    const iface = new ethers.utils.Interface(ABI)
    const factoryCallData = iface.encodeFunctionData('deploy', [ bytecode, salt ])

    const coder = new ethers.utils.AbiCoder()

    // EIP6492 signature
    return coder.encode(['address', 'bytes', 'bytes'], [
        create2FactoryAddress,
        factoryCallData,
        signature,
    ]) + magicBytes
}