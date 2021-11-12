const { ethers } = require("ethers");
const resources  = require("./contracts/resources");
const generic_resources  = require( "./contracts/generic_resources");
const nativeTokens = require("./nativeTokens");
const BigNumber = require('bignumber.js');//BN that supports decimals

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

    this.getSummary = (network, txData) => {
        const txCallSignature = txData.data.substr(0, 10)
        const method = this.methods.find(a => a.signature === txCallSignature)
        //console.log(txCallSignature);
        if(method){
            const inputs = this.interface.decodeFunctionData(method.name, txData.data)
            return method.summary({
                network,
                txData,
                inputs,
                contract: this
            })
        }
    }

    this.humanAmount = (network, address, weiValue, displayDecimals=4) => {
        if (new BigNumber(new BigNumber(weiValue.toString()).comparedTo("1e70")) == 1) {//=== number comparison fails
            return "(infinity)";
        }

        const decimals = this.getTokenDecimals(network, address);
        if(decimals == 0){
            return weiValue + "(wei)"//TODO: check whats the best fallback
        }
        return new BigNumber(weiValue).div(10**decimals).toFixed(displayDecimals)
    }

    this.getTokenSymbol = (network, address) => {
        if(address === "native"){
            return nativeTokens[network.id].symbol || "NATIVE";
        }
        if(!this.manager.erc20Tokens[network.id]) return address;
        const token = Object.values(this.manager.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase());
        if(token){
            return token.symbol;
        }
        return address;
    }

    this.getTokenDecimals = (network, address) =>{
        if(!address) return 0;//TODO : best way to handle unknown decimals situation. should not happen. good fallback? if 1 : if user sees insane numbers, it would turn him off? if 0, he might be cancel as well
        if(address === "native"){
            return nativeTokens[network.id].decimals || 0
        }
        if(!this.manager.erc20Tokens[network.id]) return 0
        const token = Object.values(this.manager.erc20Tokens[network.id]).find(a => a.address.toLowerCase() === address.toLowerCase())
        if(token){
            return token.decimals;
        }
        return 0
    }

    this.getContractName = (network, address) =>{
        if(!this.manager.contracts[network.id]) return address;

        const contract = this.manager.contracts[network.id].find(a => a.address.toLowerCase() === address.toLowerCase());
        if(contract){
            return contract.name;
        }
        return address;
    }
}

module.exports = Contract;
