const { ethers } = require("ethers");

function Contract(manager, contractData){

    this.manager = manager;
    this.methods = [];
    this.id = new Date().getTime();
    this.interface = null;
    this.address = contractData.address;
    this.name = contractData.name;

    if(!contractData.interface.abi){
        console.log("Missing ABI for contract");
        console.log(contractData);
        return;
    }

    this.interface = new ethers.utils.Interface(contractData.interface.abi);

    for(let m in contractData.interface.methods){
        contractData.interface.methods[m].signature = this.interface.getSighash(contractData.interface.methods[m].name);
        this.methods.push(contractData.interface.methods[m])
    }

    this.getSummary = (network, txn) => {
        const txCallSignature = txn.data.substr(0, 10)
        const method = this.methods.find(a => a.signature === txCallSignature)
        //console.log(txCallSignature);
        if(method){
            const inputs = this.interface.decodeFunctionData(method.name, txn.data)
            return method.summary({
                network,
                txn,
                inputs,
                contract: this
            })
        }
    }

    this.humanAmount = (network, address, weiValue, displayDecimals=4) => {
        return this.manager.humanAmount(network, address, weiValue, displayDecimals);
    }

    this.tokenSymbol = (network, address, unknownCallback) => {
        return this.manager.tokenSymbol(network, address, unknownCallback);
    }

    this.tokenDecimals = (network, address) =>{
        return this.manager.tokenDecimals(network, address);
    }

    this.alias = (network, from, txOriginAddress) =>{
        return this.manager.alias(network, from, txOriginAddress);
    }
}

module.exports = Contract;
