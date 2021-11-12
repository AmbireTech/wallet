const generic_resources = require('./generic_resources');
const tokens = require('./erc20/list');

module.exports = {
    polygon: [
        {
            name:'QuickSwap Router',
            address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
            interface: generic_resources.uniswapRouterV2.interface,
        },
    ].concat(Object.values(tokens.polygon).map(a => {
        return {
            name: a.symbol,
            address: a.address,
            interface: generic_resources.erc20.interface,
        }
    }))
}
