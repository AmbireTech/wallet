/* eslint-disable import/no-cycle */
import UniRouters from './UniRouters/UniRouters'
import ERC20 from './ERC20'
import AaveLendingPoolV2 from './AaveLendingPoolV2'
import ERC721 from './ERC721'
import WETH from './WETH'
import AmbireIdentity from './AmbireIdentity'
import AmbireFactory from './AmbireFactory'
import YearnTesseractVault from './YearnTesseractVault'
import Movr from './Movr'
import OpenSea from './OpenSea'
import WALLETSupplyController from './WALLETSupplyController'
import AmbireBatcher from './AmbireBatcher'
import WALLETStakingPool from './WALLETStakingPool'
import AaveWethGatewayV2 from './AaveWethGatewayV2'
import OneInch from './OneInch'
import UniswapV3Pool from './UniswapV3Pool'
import Bungee from './Bungee'
import CowSwap from './CowSwap'
import MeanFinance from './MeanFinance'
import GMX from './GMX'

const all = ({ humanizerInfo, tokenList }) => ({
  ...UniRouters(humanizerInfo),
  ...AaveLendingPoolV2(humanizerInfo),
  ...AaveWethGatewayV2(humanizerInfo.abis),
  ...ERC20(humanizerInfo),
  ...ERC721(humanizerInfo, tokenList),
  ...WETH(humanizerInfo.abis),
  ...AmbireIdentity(humanizerInfo),
  ...AmbireFactory(),
  ...YearnTesseractVault(humanizerInfo),
  ...Movr(humanizerInfo),
  ...OpenSea(humanizerInfo),
  ...WALLETSupplyController(),
  ...AmbireBatcher(humanizerInfo, tokenList),
  ...WALLETStakingPool(humanizerInfo),
  ...OneInch(humanizerInfo),
  ...UniswapV3Pool(humanizerInfo),
  ...Bungee(humanizerInfo),
  ...CowSwap(humanizerInfo),
  ...MeanFinance(humanizerInfo),
  ...GMX(humanizerInfo)
})

export default all
