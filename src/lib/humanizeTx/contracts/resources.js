const generic_resources = require('./generic_resources');
const tokens = require('./erc20/list');
const erc721 = require('./erc721/list');

module.exports = {
    polygon: [
        {
            name:'QuickSwap Router',
            address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
            interface: generic_resources.uniswapV2Router.interface,
        },
    ].concat(Object.values(tokens.polygon).map(a => {
        return {
            name: a.symbol,
            address: a.address,
            interface: generic_resources.erc20.interface,
        }
    })).concat(Object.values(erc721.polygon).map(a => {
        return {
            name: a.symbol,
            address: a.address,
            interface: generic_resources.erc721.interface,
        }
    })),
    ethereum: [
        {
            name: 'UniswapV3 Router',
            address: '0xe592427a0aece92de3edee1f18e0157c05861564',
            interface: generic_resources.uniswapV3Router.interface
        },
        {
            name: 'Sushi Masterchef V1',
            address: '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd',
            interface: generic_resources.masterchefV1.interface
        },
        {
            name: 'WETH',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            interface: require('./specific/weth').interface
        },
        {
            name: 'AaveLendingPool',
            address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
            interface: require('./specific/weth').interface
        }
    ].concat(Object.values(tokens.ethereum).map(a => {
        return {
            name: a.symbol,
            address: a.address,
            interface: generic_resources.erc20.interface,
        }
    })).concat(Object.values(erc721.ethereum).map(a => {
        return {
            name: a.symbol,
            address: a.address,
            interface: generic_resources.erc721.interface,
        }
    }))
}
