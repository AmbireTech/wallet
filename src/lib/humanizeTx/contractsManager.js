const { ethers } = require("ethers");
const resources  = require("./contracts/resources");
const generic_resources  = require( "./contracts/generic_resources");

module.exports = {
    contracts: {},
    generic_contracts: [],
    init(){
        for(let chain in resources){
            for(let c in resources[chain]){
                if(!this.contracts[chain]) this.contracts[chain] = [];
                const contract = resources[chain][c];
                if(!contract.interface.abi){
                    console.log("Missing ABI for contract");
                    console.log(contract);
                    continue;
                }
                let iface = new ethers.utils.Interface(contract.interface.abi);
                for(let m in contract.interface.methods){
                    contract.interface.methods[m].signature = iface.getSighash(contract.interface.methods[m].name);
                    this.contracts[chain].push(contract);
                }
            }
        }

        //for unknown destination, to try to match signature
        for(let c in generic_resources){
            const contract = generic_resources[c];
            let iface = new ethers.utils.Interface(contract.interface.abi);
            for(let m in contract.interface.methods){
                contract.interface.methods[m].signature = iface.getSighash(contract.interface.methods[m].name);
                this.generic_contracts.push(contract);
            }
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

    getSummary(chainName, txData){
        const txCallSignature = txData.data.substr(0, 10);
        //upstream redundant?
        if(txCallSignature != "0x"){
            const destinationContract = this.contracts[chainName.toLowerCase()].find(a => a.address.toLowerCase() === txData.to.toLowerCase());
            let method;
            let iface;
            let decodedInputs = {};
            if(destinationContract){
                method = destinationContract.interface.methods.find(a => a.signature === txCallSignature);
                iface = new ethers.utils.Interface(destinationContract.interface.abi);
            }else{
                const {genericContract, genericMethod} = this.getGenericContractBySignature(txCallSignature.toLowerCase());
                if(genericContract){
                    method = genericMethod;
                    iface = new ethers.utils.Interface(genericContract.interface.abi);
                }
            }
            if(method){
                decodedInputs = iface.decodeFunctionData(method.name, txData.data);
                return method.summary(this, chainName.toLowerCase(), txData, decodedInputs);
            }else{
                return "Unknown call to " + txData.to;
            }
        }
    }
}
