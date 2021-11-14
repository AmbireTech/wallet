const { ethers } = require("ethers");
const Contract = require("./contract");
const resources  = require("./contracts/resources");
const generic_resources  = require( "./contracts/generic_resources");
const tokens = require('./contracts/erc20/list');
const erc721Tokens = require('./contracts/erc721/list');
const nativeTokens = require("./nativeTokens");
const BigNumber = require('bignumber.js');//BN that supports decimals

module.exports = {
    erc20Tokens: tokens,
    erc721Tokens: erc721Tokens,
    contracts: {},
    generic_contracts: [],
    addressBook:{},
    init(){
        for(let chain in resources){
            for(let c in resources[chain]){
                if(!this.contracts[chain]) this.contracts[chain] = [];
                const contract = new Contract(this, resources[chain][c]);
                this.contracts[chain].push(contract);
            }
        }

        //for unknown destination, to try to match signature
        for(let c in generic_resources){
            const contract = new Contract(this, generic_resources[c]);
            this.generic_contracts.push(contract);
        }
    },

    initAddressBook(contactsByChain){
        //{
        // polygon: [
        //  {
        //      addr:"0x",
        //      name: "Alice"
        //  },
        // ]
        // }
        this.addressBook = contactsByChain;
    },

    //signature expectd lowerCase
    getGenericMethodBySignature(signature){
        for(let i in this.generic_contracts){
            const method = this.generic_contracts[i].methods.find(m => m.signature === signature)
            if(method){
                return {
                    genericContract: this.generic_contracts[i],
                    genericMethod: method
                }
            }
        }
        return { genericContract: null, genericMethod: null }
    },

    getSummary(network, txn){
        const txCallSignature = txn.data?txn.data.substr(0, 10) : "0x"
        //upstream redundant?
        let summary;
        if(txCallSignature != "0x"){
            if(!txn.to){
                return [
                  `Deploy new contract`,
                    txn.value?`Sending ${this.humanAmount(network, 'native', txn.value)} ${this.tokenSymbol(network, 'native')}`:null
                ].filter(a => a !== null);
            }else{
                const destinationContract = this.contracts[network.id.toLowerCase()].find(a => a.address.toLowerCase() === txn.to.toLowerCase());
                if (destinationContract) {
                    summary = destinationContract.getSummary(network, txn);
                } else {
                    //TODO optimize
                    const {genericContract, genericMethod} = this.getGenericMethodBySignature(txCallSignature);
                    if(genericContract){
                        summary = genericContract.getSummary(network, txn);
                    }
                }
                return summary || [(txn.value?`Sending ${this.humanAmount(network, 'native', txn.value)} ${this.tokenSymbol(network, 'native')}`:null), `Unknown call(${txCallSignature}) to ${this.alias(network, txn.from, txn.to)}`].filter(a => a !== null)
            }
        }else{
            if(txn.value){
                return `Send ${this.humanAmount(network, 'native', txn.value)} ${this.tokenSymbol(network, 'native')} to ${this.alias(network, txn.from, txn.to)}`
            }else{
                if(txn.from == txn.to) {
                    //TODO find a way to compare the nonces
                    return [`Sending nothing to self (probably replacement transaction)`]
                }
                return [`Send valueless transaction to ${this.alias(network, txn.from, txn.to)}`]
            }
        }
    },


    humanAmount(network, address, weiValue, displayDecimals=4, amountCallback){
        if (new BigNumber(new BigNumber(weiValue.toString()).comparedTo("1e70")) == 1) {//=== number comparison fails
            if(amountCallback){ return amountCallback({ infinity:true, amount:weiValue, decimals:null })}
            return '(∞)';
        }

        const decimals = this.tokenDecimals(network, address);
        if(decimals == 0){
            if(amountCallback){ return amountCallback({ unknownDecimals:true, amountWei: weiValue, decimals:0})}
            return weiValue + "(wei)"//TODO: check whats the best fallback
        }
        return new BigNumber(weiValue).div(10**decimals).toFixed(displayDecimals)
    },

    tokenSymbol(network, address, unknownFallback){
        if(address === "native"){
            return nativeTokens[network.id].symbol || "NATIVE";
        }
        if(this.erc20Tokens[network.id]){
            const token = Object.values(this.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase());
            if(token){
                return token.symbol;
            }
        }
        if(unknownFallback){
            return unknownFallback
        }
        return 'Unknown token ' + address;
    },


    tokenDecimals(network, address){
        if(!address) return 0;//TODO : best way to handle unknown decimals situation. should not happen. good fallback? if 1 : if user sees insane numbers, it would turn him off? if 0, he might be cancel as well
        if(address === "native"){
            return nativeTokens[network.id].decimals || 0
        }
        if(!this.erc20Tokens[network.id]) return 0
        const token = Object.values(this.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase())
        if(token){
            return token.decimals;
        }
        return 0
    },

    alias(network, txOriginAddress, address){
        if(txOriginAddress.toLowerCase() === address.toLowerCase()) return "self";

        if(this.contracts[network.id]){
            const contract = this.contracts[network.id].find(a => a.address.toLowerCase() === address.toLowerCase());
            if(contract){
                return contract.name;
            }
        }

        if(this.addressBook[network.id]){
            const contact = this.addressBook[network.id].find(a => a.address.toLowerCase() === address.toLowerCase());
            if(contact){
                return contact.name;
            }
        }

        return address;
    }

}
