const {ethers} = require('ethers')

function HumanContract(manager, contractData) {

  this.manager = manager
  this.methods = []
  this.id = new Date().getTime()
  this.interface = null
  this.data = contractData.data || {}
  this.address = contractData.address
  this.name = contractData.name

  if (!contractData.interface.abi) {
    console.log('Missing ABI for contract')
    console.log(contractData)
    return
  }

  this.interface = new ethers.utils.Interface(contractData.interface.abi)

  for (let m in contractData.interface.methods) {
    if (!contractData.interface.methods[m].signature) {
      console.error('Signature missing for ' + contractData.name + ' : ' + contractData.interface.methods[m].name)
      try {
        contractData.interface.methods[m].signature = this.interface.getSighash(contractData.interface.methods[m].name)
      } catch (e) {
        console.error('Contract Init : ' + e)
      }
    }
    this.methods.push(contractData.interface.methods[m])
  }

  this.getMethodName = (signature) => {
    const method = this.methods.find(a => a.signature === signature);
    if(method) return method.name;
  }

  this.getSummary = (network, txn) => {
    const txCallSignature = txn.data.substr(0, 10)
    const method = this.methods.find(a => a.signature === txCallSignature)
    if (method) {
      try {
        const inputs = this.interface.decodeFunctionData(txCallSignature, txn.data)
        return method.summary({
          network,
          txn,
          inputs,
          humanContract: this
        })
      } catch (e) {
        console.error('getSummary Error')
        console.log(e)
        return [
          `Unknown call to ${this.manager.aliasData(txn.from, txn.to).alias} (unable to parse)`
        ]
      }
    }
  }

  this.tokenDecimals = (network, address) => {
    return this.manager.tokenDecimals(network, address)
  }

}

module.exports = HumanContract
