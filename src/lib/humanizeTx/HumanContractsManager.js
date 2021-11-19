const HumanContract = require('./HumanContract')
const resources = require('./contracts/resources')
const generic_resources = require('./contracts/generic_resources')
const tokens = require('./contracts/erc20/list')
const erc721Tokens = require('./contracts/erc721/list')
const nativeTokens = require('./nativeTokens')
const BigNumber = require('bignumber.js')//BN that supports decimals
const SummaryFormatter = require('./summaryFormatter')

module.exports = {
  erc20Tokens: tokens,
  erc721Tokens: erc721Tokens,
  contracts: {},
  generic_contracts: [],
  addressBook: {},
  init() {
    for (let chain in resources) {
      for (let c in resources[chain]) {
        if (!this.contracts[chain]) this.contracts[chain] = []
        const contract = new HumanContract(this, resources[chain][c])
        this.contracts[chain].push(contract)
      }
    }

    //for unknown destination, to try to match signature
    for (let c in generic_resources) {
      const contract = new HumanContract(this, generic_resources[c])
      this.generic_contracts.push(contract)
    }
  },

  initAddressBook(contactsByChain) {
    //{
    // polygon: [
    //  {
    //      addr:'0x',
    //      name: 'Alice'
    //  },
    // ]
    // }
    this.addressBook = contactsByChain
  },

  //signature expectd lowerCase
  getGenericMethodBySignature(signature) {
    for (let i in this.generic_contracts) {
      const method = this.generic_contracts[i].methods.find(m => m.signature === signature)
      if (method) {
        return {
          genericContract: this.generic_contracts[i],
          genericMethod: method
        }
      }
    }
    return {genericContract: null, genericMethod: null}
  },

  getSummary(network, txn) {

    const txCallSignature = txn.data ? txn.data.substr(0, 10) : '0x'
    //upstream redundant?
    const SF = new SummaryFormatter(network, this)
    const summary = {
      interaction: {
        signature: null,
        name: null
      },
      summaries: [],
      value: txn.value,
    }

    try{
      if (txCallSignature !== '0x') {
        if (!txn.to) {
          summary.summaries = SF.actions([
            SF.text(`Deploy new contract`)
              .action(),

            txn.value > 0
            && SF.text(`Sending`)
              .tokenAmount('native', txn.value)
              .action()
          ])
        } else {
          let s
          const destinationContract = this.contracts[network.id.toLowerCase()].find(a => a.address.toLowerCase() === txn.to.toLowerCase())
          if (destinationContract) {
            summary.interaction = {
              signature: txCallSignature,
              method: destinationContract.getMethodName(txCallSignature),
              name: destinationContract.name,
              icon: destinationContract.icon
            }
            s = destinationContract.getSummary(network, txn)
          } else {
            //TODO optimize
            const {genericContract} = this.getGenericMethodBySignature(txCallSignature)
            if (genericContract) {
              s = genericContract.getSummary(network, txn)
              const contractAliasData = this.aliasData(network, txn.from, txn.to)
              summary.interaction = {
                signature: txCallSignature,
                method: genericContract.getMethodName(txCallSignature),
                name: `${contractAliasData.alias} (${genericContract.name})`,
              }
            } else {
              summary.interaction = {
                signature: txCallSignature,
                name: `Unknown`
              }
            }
          }
          if (s) {
            summary.summaries = s
          } else {
            summary.summaries = SF.actions([
              txn.value > 0
              && SF.text(`Sending`)
                .tokenAmount('native', txn.value)
                .action(),

              SF.text(`Unknown call(${txCallSignature}) to`)
                .alias(txn.from, txn.to)
                .action(),
            ])
          }
        }
      } else {
        const interactionAliasData = this.aliasData(network, txn.from, txn.to)
        summary.interaction = {
          signature: false,
          name: interactionAliasData.alias
        }
        if (txn.value) {
          summary.summaries = SF.actions([
            txn.value > 0
            && SF.text(`Send`)
              .tokenAmount('native', txn.value)
              .text('to')
              .alias(txn.from, txn.to)
              .action()
          ])
        } else {
          if (txn.from === txn.to) {
            //TODO find a way to compare the nonces
            summary.summaries = SF.actions([
              SF.text(`Send nothing to self (probably replacement transaction)`)
                .action()
            ])
          } else {
            summary.summaries = SF.actions([
              SF.text(`Send valueless transaction to`)
                .alias(txn.from, txn.to)
                .action()
            ])
          }
        }
      }
    }catch(e){
      console.error("Failed to get summary for tx.");
      console.log(txn);
      summary.summaries = {
        action: 'Unknown',
        actions: [{
          plain: 'Failed to parse ' + JSON.stringify(txn),
          rich: null
        }]
      }
    }

    return summary
  },


  humanAmount(network, address, weiValue, displayDecimals = 4, amountCallback) {
    if (new BigNumber(new BigNumber(weiValue.toString()).comparedTo('1e70')) === 1) {//=== number comparison fails
      if (amountCallback) {
        return amountCallback({infinity: true, amount: weiValue, decimals: null})
      }
      return '(∞)'
    }

    const decimals = this.tokenDecimals(network, address)
    if (decimals === 0) {
      if (amountCallback) {
        return amountCallback({unknownDecimals: true, amountWei: weiValue, decimals: 0})
      }
      return weiValue + '(wei)'//TODO: check whats the best fallback
    }
    return new BigNumber(weiValue).div(10 ** decimals).toFixed(displayDecimals)
  },

  //forRichContent
  tokenData(network, address, unknownFallback) {
    const tokenData = {
      exists: true,
      symbol: null,
      network: network.id,
      address: address
    }
    if (address === 'native') {
      tokenData.symbol = nativeTokens[network.id].symbol || 'NATIVE'
      return tokenData
    }
    if (this.erc20Tokens[network.id]) {
      const token = Object.values(this.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase())
      if (token) {
        tokenData.symbol = token.symbol
        return tokenData
      }
    }
    if (unknownFallback) {
      return unknownFallback
    }
    tokenData.exists = false
    tokenData.symbol = 'Unknown token'
    return tokenData
  },

  aliasData(network, txOriginAddress, address) {
    const aliasData = {
      address: address,
      alias: address,
      contract: false,
      self: false
    }

    if (txOriginAddress.toLowerCase() === address.toLowerCase()) {
      aliasData.self = true
      aliasData.alias = 'self'
      return aliasData
    }

    if (this.contracts[network.id]) {
      const contract = this.contracts[network.id].find(a => a.address.toLowerCase() === address.toLowerCase())
      if (contract) {
        aliasData.contract = true
        aliasData.alias = contract.name
        return aliasData
      }
    }

    if (this.addressBook[network.id]) {
      const contact = this.addressBook[network.id].find(a => a.address.toLowerCase() === address.toLowerCase())
      if (contact) {
        aliasData.contract = false
        aliasData.alias = contact.name
        return aliasData
      }
    }

    return aliasData
  },


  tokenDecimals(network, address) {
    if (!address) return 0//TODO : best way to handle unknown decimals situation. should not happen. good fallback? if 1 : if user sees insane numbers, it would turn him off? if 0, he might be cancel as well
    if (address === 'native') {
      return nativeTokens[network.id].decimals || 0
    }
    if (!this.erc20Tokens[network.id]) return 0
    const token = Object.values(this.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase())
    if (token) {
      return token.decimals
    }
    return 0
  },

}
