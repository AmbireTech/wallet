//Mapping Specific to Generic
module.exports = [
  { name: 'SushiSwap', network: 'polygon', address: '0x1b02da8cb0d097eb8d57a175b88c7d8b47997506', generic: 'UniswapV2Router' },
  { name: 'SushiSwap', network: 'ethereum', address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F' , generic: 'UniswapV2Router'},
  { name: 'QuickswapRouter', network: 'polygon', address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' , generic: 'UniswapV2Router'},

  { name: 'UniswapV3Router', network: 'ethereum', address: '0xe592427a0aece92de3edee1f18e0157c05861564' , generic: 'UniswapV3Router'},

  { name: 'SushiMasterchefV1', network: 'ethereum', address: '0xc2edad668740f1aa35e4d8f227fb8e17dca888cd' , generic: 'MasterchefV1'},
  { name: 'SushiMasterchefV2', network: 'ethereum', address: '0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d' , generic: 'MasterchefV2'},

  { name: 'WETH', network: 'ethereum', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' , generic: 'WETH'},
  { name: 'WMATIC', network: 'ethereum', address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' , generic: 'WETH'},

  { name: 'AmbireIdentity', network: 'polygon', address: '0x900C6A3417631F54d130b9382264C6b3c712CADD' , generic: 'AmbireIdentity'},

  { name: 'synthetixStakingRewards_UniV2_sXAU', network: 'ethereum', address: '0x8302fe9f0c509a996573d3cc5b0d5d51e4fdd5ec' , generic: 'AmbireIdentity'},

  { name: 'curveUSDTGauge', network: 'ethereum', address: '0xBC89cd85491d81C6AD2954E6d0362Ee29fCa8F53' , generic: 'curveGauge'},
  { name: 'curveUSDTDeposit', network: 'ethereum', address: '0xac795d2c97e60df6a99ff1c814727302fd747a80' , generic: 'curveDeposit'},
  { name: 'curveUSDTSwap', network: 'ethereum', address: '0x52EA46506B9CC5Ef470C5bf89f17Dc28bB35D85C' , generic: 'curveSwap'},

  { name: 'cDai', network: 'ethereum', address: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643' , generic: 'cToken'},
]
