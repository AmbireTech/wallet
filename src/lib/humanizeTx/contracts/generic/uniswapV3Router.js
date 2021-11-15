const { ethers } = require("ethers");
const ABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH9","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactInputParams","name":"params","type":"tuple"}],"name":"exactInput","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMinimum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactInputSingleParams","name":"params","type":"tuple"}],"name":"exactInputSingle","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"bytes","name":"path","type":"bytes"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"}],"internalType":"struct ISwapRouter.ExactOutputParams","name":"params","type":"tuple"}],"name":"exactOutput","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"address","name":"tokenIn","type":"address"},{"internalType":"address","name":"tokenOut","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMaximum","type":"uint256"},{"internalType":"uint160","name":"sqrtPriceLimitX96","type":"uint160"}],"internalType":"struct ISwapRouter.ExactOutputSingleParams","name":"params","type":"tuple"}],"name":"exactOutputSingle","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"refundETH","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowed","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitAllowedIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"selfPermitIfNecessary","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"sweepToken","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"sweepTokenWithFee","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"int256","name":"amount0Delta","type":"int256"},{"internalType":"int256","name":"amount1Delta","type":"int256"},{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"uniswapV3SwapCallback","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"}],"name":"unwrapWETH9","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountMinimum","type":"uint256"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"feeBips","type":"uint256"},{"internalType":"address","name":"feeRecipient","type":"address"}],"name":"unwrapWETH9WithFee","outputs":[],"stateMutability":"payable","type":"function"},{"stateMutability":"payable","type":"receive"}];

module.exports = {
    name: "UniswapV3Router",
    interface: {
        methods:[
            {
                name: "multicall",
                signature: '0xac9650d8',
                summary: ({network, txn, inputs, contract}) => {

                    const iface = new ethers.utils.Interface(ABI);
                    const calldataArray = iface.decodeFunctionData(txn.data.slice(0,10), txn.data)

                    const summaries = [];
                    for(const calldata of calldataArray.data) {
                        const subTx = {
                            ...txn,
                            data: calldata
                        }
                        const subSummary = contract.manager.getSummary(network, subTx);
                        summaries.push(...subSummary.summaries);
                    }

                    return summaries;
                }
            },
            {
                name: "selfPermit",
                signature: '0xf3995c67',
                summary: ({network, txn, inputs, contract}) => {
                    return [`SELF PERMIT`];
                }
            },
            {
                name: "exactInputSingle",
                signature: '0x414bf389',
                summary: ({network, txn, inputs, contract}) => {
                    return [
                        `Swap ${contract.humanAmountSymbol(network, inputs.params.tokenIn, inputs.params.amountIn.toString())}`
                        + ` for at least ${(contract.humanAmountSymbol(network, inputs.params.tokenOut, inputs.params.amountOutMinimum.toString()))}`
                  ]
                }
            },
            {
                name: "exactInput",
                signature: '0xc04b8d59',
                summary: ({network, txn, inputs, contract}) => {
                    //some decodePacked fun
                    const path = [];
                    for (let i = 2; i < inputs.params.path.length; i+=46) {//address, uint24
                        path.push('0x' + inputs.params.path.substr(i, 40));
                    }
                    return [
                        `Swap ${contract.humanAmountSymbol(network, path[0], inputs.params.amountIn.toString())}`
                        + ` for at least ${(contract.humanAmountSymbol(network, path[path.length-1], inputs.params.amountOutMinimum.toString()))}`
                    ]
                }
            },
            {
                name: "exactOutputSingle",
                signature: '0xdb3e2198',
                summary: ({network, txn, inputs, contract}) => {
                    return [
                        `Swap a maximum of ${contract.humanAmountSymbol(network, inputs.params.tokenIn, inputs.params.amountInMaximum.toString())}`
                        + ` for exactly ${(contract.humanAmountSymbol(network, inputs.params.tokenOut, inputs.params.amountOut.toString()))}`
                    ]
                }
            },
            //to be tested
            {
                name: "exactOutput",
                signature: '0xf28c0498',
                summary: ({network, txn, inputs, contract}) => {
                    //some decodePacked fun
                    const path = [];
                    for (let i = 2; i < inputs.params.path.length; i+=46) {//address, uint24
                        path.push('0x' + inputs.params.path.substr(i, 40));
                    }
                    return [
                        `Swap ${contract.humanAmountSymbol(network, path[0], inputs.params.amountInMaximum.toString())} maximum`
                        + ` for ${(contract.humanAmountSymbol(network, path[path.length-1], inputs.params.amountOut.toString()))}`
                    ]
                }
            },
            {
                name: "unwrapWETH9",
                signature: '0x49404b7c',
                summary: ({network, txn, inputs, contract}) => {
                    return [`Unwrap ${contract.humanAmount(network, 'native', inputs.amountMinimum.toString())} WETH`]//hax for 18 decimals
                }
            },
        ],
        abi: ABI
    }
}
