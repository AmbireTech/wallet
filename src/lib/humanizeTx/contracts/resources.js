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
            name: 'AaveLendingPooV1',
            address: '0x398ec7346dcd622edc5ae82352f02be94c62d119',
            interface: require('./specific/aaveLendingPoolV1').interface
        },
        {
            name: 'AaveLendingPooV2',
            address: '0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9',
            interface: require('./specific/aaveLendingPoolV2').interface
        },
        {
            name: 'cDai',
            address: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
            data: {underlying: tokens.ethereum.DAI},
            interface: require('./generic/cTokens').interface
        },

        {
            name: 'curveUSDTSwap',
            address: '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C',
            data: {
                underlying: {
                    0: tokens.ethereum.DAI,
                    1: tokens.ethereum.USDC,
                    2: tokens.ethereum.USDT
                },
                lpToken: tokens.ethereum.curveFi_cDAI_cUSDC_USDT
            },
            interface: require('./generic/curveSwap').interface
        },
        {
            name: 'curveUSDTDeposit',
            address: '0xac795d2c97e60df6a99ff1c814727302fd747a80',
            data: {
                underlying: {
                    0: tokens.ethereum.DAI,
                    1: tokens.ethereum.USDC,
                    2: tokens.ethereum.USDT
                },
                lpToken: tokens.ethereum.curveFi_cDAI_cUSDC_USDT
            },
            interface: require('./generic/curveDeposit').interface
        },
        {
            name: 'curveUSDTGauge',
            address: '0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53',
            data: {
                lpToken: tokens.ethereum.curveFi_cDAI_cUSDC_USDT
            },
            interface: require('./generic/curveGauge').interface
        },




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
