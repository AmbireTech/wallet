const ABIS = require('../consts/abi_blob').verifiedContracts

//Generic ABIS are prefixed with _
module.exports.getGenericAbi = (name) => {
  name = name.toLowerCase()
  if (!ABIS['_' + name]) throw Error('Could not find generic ABI ' + name)
  return ABIS['_' + name].abi
}

//should sanitize network?
module.exports.getSpecificAbiByName = (name, network) => {
  name = name.toLowerCase()
  const abi = Object.values(ABIS).find(c => c.addresses.find(a => a.name.toLowerCase() === name.toLowerCase() && a.network === network))
  if (abi) return abi.abi
  throw Error('Could not find specific ABI by name' + network + ':' + name)
}

module.exports.getAddressByKey = (name, network) => {
  name = name.toLowerCase()
  if (!ABIS[network + ':' + name]) throw Error('Could not find address by key ' + network + ':' + name)
  return ABIS[network + ':' + name].addresses[0].address
}

module.exports.getAddressByName = (name, network) => {
  name = name.toLowerCase()
  for (const contract of Object.values(ABIS)) {
    for (const addr of contract.addresses) {
      if (addr.network === network && addr.name.toLowerCase() === name.toLowerCase()) {
        return addr.address
      }
    }
  }
  throw Error('Could not find specific ABI by name ' + network + ':' + name)
}
