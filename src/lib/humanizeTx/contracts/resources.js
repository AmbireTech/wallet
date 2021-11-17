const generic_resources = require('./generic_resources')
const tokens = require('./erc20/list')
const erc721 = require('./erc721/list')
const { getAddressByName } = require('../../abiFetcher')

module.exports = {
  polygon: [
    {
      name: 'QuickSwap Router',
      address: getAddressByName('QuickswapRouter', 'polygon'),
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
      address: getAddressByName('UniswapV3Router', 'ethereum'),
      interface: generic_resources.uniswapV3Router.interface
    },
    {
      name: 'Sushi Masterchef V1',
      address: getAddressByName('SushiMasterchefV1', 'ethereum'),
      interface: generic_resources.masterchefV1.interface
    },
    {
      name: 'Sushi Masterchef V2',
      address: getAddressByName('SushiMasterchefV2', 'ethereum'),
      interface: generic_resources.masterchefV2.interface
    },
    {
      name: 'WETH',
      address: getAddressByName('WETH', 'ethereum'),
      interface: require('./generic/weth').interface
    },
    {
      name: 'AaveLendingPooV1',
      address: getAddressByName('AaveLendingPool1', 'ethereum'),
      interface: require('./specific/aaveLendingPoolV1').interface
    },
    {
      name: 'AaveLendingPooV2',
      address: getAddressByName('AaveLendingPool2', 'ethereum'),
      interface: require('./specific/aaveLendingPoolV2').interface
    },
    {
      name: 'cDai',
      address: getAddressByName('cdai', 'ethereum'),
      data: {underlying: tokens.ethereum.DAI},
      interface: require('./generic/cTokens').interface
    },

    {
      name: 'curveUSDTSwap',
      address: getAddressByName('curveUSDTSwap', 'ethereum'),
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
      address: getAddressByName('curveUSDTDeposit', 'ethereum'),
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
      address: getAddressByName('curveUSDTGauge', 'ethereum'),
      data: {
        lpToken: tokens.ethereum.curveFi_cDAI_cUSDC_USDT
      },
      interface: require('./generic/curveGauge').interface
    },
    {
      name: 'synthetixStakingRewards_UniV2_sXAU',
      address: getAddressByName('synthetixStakingRewards_UniV2_sXAU', 'ethereum'),
      data: {
        lpToken: tokens.ethereum.UniV2_LP_sXau_USDC
      },
      interface: require('./generic/synthetixStakingRewards').interface
    },

    //Ambire
    {
      name: 'AmbireIdentity',
      address: getAddressByName('AmbireIdentity', 'polygon'),
      interface: require('./specific/ambireIdentity').interface
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
