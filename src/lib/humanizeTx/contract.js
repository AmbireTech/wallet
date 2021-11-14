const { ethers } = require("ethers");

function Contract(manager, contractData){

    this.manager = manager;
    this.methods = [];
    this.id = new Date().getTime();
    this.interface = null;
    this.data = contractData.data || {};
    this.address = contractData.address;
    this.name = contractData.name;

    if(!contractData.interface.abi){
        console.log("Missing ABI for contract");
        console.log(contractData);
        return;
    }

    this.interface = new ethers.utils.Interface(contractData.interface.abi);

    for(let m in contractData.interface.methods){
        try{
            contractData.interface.methods[m].signature = this.interface.getSighash(contractData.interface.methods[m].name);
            this.methods.push(contractData.interface.methods[m])
        }catch(e){
            console.error("Contract Init : " + e);
        }
    }

    this.getSummary = (network, txn) => {
        const txCallSignature = txn.data.substr(0, 10)
        const method = this.methods.find(a => a.signature === txCallSignature)
        //console.log(txCallSignature);
        if(method){
            console.log(":::: " + method.name);
            try{
                const inputs = this.interface.decodeFunctionData(method.name, txn.data)
                return method.summary({
                    network,
                    txn,
                    inputs,
                    contract: this
                })
            }catch(e){
                console.error('getSummary : ' + e)
                return [
                  `Unknown call to ${this.alias(network, txn.from, txn.to)} (unable to parse)`
                ]
            }
        }
    }

    this.humanAmount = (network, address, weiValue, displayDecimals=4) => {
        return this.manager.humanAmount(network, address, weiValue, displayDecimals);
    }

    this.humanAmountSymbol = (network, address, weiValue, displayDecimals=4, unknownCallback, amountCallback) => {
        return this.manager.humanAmount(network, address, weiValue, displayDecimals, amountCallback) + " " + this.tokenSymbol(network, address, unknownCallback);
    }

    this.tokenSymbol = (network, address, unknownCallback) => {
        return this.manager.tokenSymbol(network, address, unknownCallback);
    }

    this.tokenDecimals = (network, address) =>{
        return this.manager.tokenDecimals(network, address);
    }

    this.alias = (network, txOriginAddress, address) =>{
        return this.manager.alias(network, txOriginAddress, address);
    }
}

module.exports = Contract;
