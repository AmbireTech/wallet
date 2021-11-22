const { ethers } = require('ethers')

async function main(){
	const unsignedTxObj = {
		//from: "0x87C0422C0E4F1F0003Eb9E4A98Dc42FeC1e61e80",
		to: "0x87C0422C0E4F1F0003Eb9E4A98Dc42FeC1e61e80",
		gasLimit: "0x016de8",
		"gasPrice": "0x0861c46800",
		"nonce": "0x01",
		"chainId": 137
	}

	const rsTx = await ethers.utils.resolveProperties(unsignedTxObj)
	console.log(rsTx);
	const serialized = ethers.utils.serializeTransaction(rsTx);
}
main()
