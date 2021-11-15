const resources  = require("../contracts/resources");
const generic_resources  = require( "../contracts/generic_resources");
const { ethers } = require("ethers");

function checkSignatures(){
    let unknownSigs = [];
    let incorrectSigs = [];

    for(let chain in resources){
      for(let c in resources[chain]){
        const iface = new ethers.utils.Interface(resources[chain][c].interface.abi);
        for(let m of resources[chain][c].interface.methods){
          const genSig = iface.getSighash(m.name);
          if(!m.signature){
            unknownSigs.push({
              contract: resources[chain][c].name,
              method: m.name,
              generatedSignature: genSig//can be multiple passes?
            })
          }else if(m.signature != genSig){
            incorrectSigs.push({
              contract: resources[chain][c].name,
              method: m.name,
              generatedSignature: genSig
            })
          }
        }
      }
    }

    //for unknown destination, to try to match signature
    for(let c in generic_resources){
      const iface = new ethers.utils.Interface(generic_resources[c].interface.abi);
      for(let m of generic_resources[c].interface.methods){
        if(!m.signature){
          unknownSigs.push({
            contract: generic_resources[c].name,
            method: m.name,
            generatedSignature: iface.getSighash(m.name)//can be multiple passes?
          })
        }
      }
    }

    return {unknownSigs, incorrectSigs};
}


const {unknownSigs, incorrectSigs} = checkSignatures();

console.log("[Unknown signatures : " + unknownSigs.length + "]");
for(let sig of unknownSigs){
  console.log(sig.contract + '   (' + sig.method + ') ' + sig.generatedSignature);
}
console.log("")

console.log("[Incorrect signatures : " + incorrectSigs.length + "]");
for(let sig of incorrectSigs){
  console.log(sig.contract + '   (' + sig.method + ') ' + sig.generatedSignature);
}
