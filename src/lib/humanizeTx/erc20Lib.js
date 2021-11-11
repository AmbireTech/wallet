const nativeTokens = require("./nativeTokens");
const tokens = require('./contracts/erc20/list');
const BigNumber = require('bignumber.js');//BN that supports decimals

module.exports = {

  humanAmount(chain, address, weiValue, displayDecimals=4){
    const decimals = this.getTokenDecimals(chain, address);
    if(decimals == 0){
      return weiValue + "(wei)"//TODO: check whats the best fallback
    }
    return new BigNumber(weiValue).div(10**decimals).toFixed(displayDecimals)
  },

  getTokenSymbol(chain, address){
    if(address === "native"){
      return nativeTokens[chain].symbol || "NATIVE";
    }
    if(!tokens[chain]) return address;
    const token = Object.values(tokens[chain]).find(a => a.address.toLowerCase() === address.toLowerCase());
    if(token){
      return token.symbol;
    }
    return address;
  },

  getTokenDecimals(chain, address){
    if(!address) return 0;//TODO : best way to handle unknown decimals situation. should not happen. good fallback? if 1 : if user sees insane numbers, it would turn him off? if 0, he might be cancel as well
    if(address === "native"){
      return nativeTokens[chain].decimals || 0;
    }
    if(!tokens[chain]) return 0;
    const token = Object.values(tokens[chain]).find(a => a.address.toLowerCase() === address.toLowerCase());
    if(token){
      return token.decimals;
    }
    return 0
  },

};
