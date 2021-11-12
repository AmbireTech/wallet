const { ethers } = require("ethers");
const Contract = require("./contract");
const resources  = require("./contracts/resources");
const generic_resources  = require( "./contracts/generic_resources");
const tokens = require('./contracts/erc20/list');

module.exports = {
    erc20Tokens: tokens,
    contracts: {},
    generic_contracts: [],
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

    //signature expectd lowerCase
    getGenericContractBySignature(chain, signature){
        if(!this.generic_contracts[chain]) return;
        for(let i in this.generic_contracts[chain]){
            const method = this.generic_contracts[chain][i].methods.find(m => m.signature === signature)
            if(method){
                return {
                    genericContract: this.generic_contracts[chain][i],
                    method: method
                };
            }
        }
    },

    getSummary(network, txData){
        const txCallSignature = txData.data.substr(0, 10);
        //upstream redundant?
        let summary;
        if(txCallSignature != "0x"){
            const destinationContract = this.contracts[network.id.toLowerCase()].find(a => a.address.toLowerCase() === txData.to.toLowerCase());
            if (destinationContract) {
                summary = destinationContract.getSummary(network, txData);
            } else {
                /*const {genericContract, genericMethod} = this.getGenericContractBySignature(txCallSignature.toLowerCase());
                if(genericContract){
                    method = genericMethod;
                    iface = new ethers.utils.Interface(genericContract.interface.abi);
                }*/
            }
            return summary || "Unknown call to " + txData.to;
        }
    },

}
