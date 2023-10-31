import { AbiCoder } from "ethers/lib/utils"

/**
 * Check if the passed txn is the gas tank commitment.
 * The gas tank commitment is a transaction the user signs
 * when he inteds to use the gas tank. It is towards to
 * feeCollector address and it has a data of:
 * 'string', 'uint256', 'string'
 * The first string should be equal to gasTank
 * The uint256 is the value from the gas tank we're paying with
 * The second string is the gas tank assetId in the database
 *
 * @param array txn [address, value, data]
 * @returns bool
 */
function isGasTankCommitment(txn) {
	try {
		const abiCoder = new AbiCoder()
		const result = abiCoder.decode(['string', 'uint256', 'string'], txn[2])
		return result[0] == 'gasTank'
	} catch (e) {
		return false
	}
}

export { isGasTankCommitment }