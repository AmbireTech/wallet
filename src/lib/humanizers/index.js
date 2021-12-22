import UniRouters from './UniRouters'
import ERC20 from './ERC20'
import AaveLendingPoolV2 from './AaveLendingPoolV2'
import ERC721 from './ERC721'
import WETH from './WETH'
import AmbireIdentity from './AmbireIdentity'
import AmbireFactory from './AmbireFactory'
import YearnVault from './YearnVault'
import TesseractVault from './TesseractVault'
import Movr from './Movr'

const all = {
	...UniRouters,
	...AaveLendingPoolV2,
	...ERC20,
	...ERC721,
	...WETH,
	...AmbireIdentity,
	...AmbireFactory,
	...YearnVault,
	...TesseractVault,
	...Movr
}
export default all