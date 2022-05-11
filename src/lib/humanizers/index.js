import UniRouters from './UniRouters'
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

const all = {
	...UniRouters,
	...AaveLendingPoolV2,
	...AaveWethGatewayV2,
	...ERC20,
	...ERC721,
	...WETH,
	...AmbireIdentity,
	...AmbireFactory,
	...YearnTesseractVault,
	...Movr,
	...OpenSea,
	...WALLETSupplyController,
	...AmbireBatcher,
	...WALLETStakingPool,
}
export default all