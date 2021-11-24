import UniRouters from './UniRouters'
import ERC20 from './ERC20'
import AaveLendingPoolV2 from './AaveLendingPoolV2'
import ERC721 from './ERC721'
import WETH from './WETH'
import AmbireIdentity from './AmbireIdentity'
import AmbireFactory from './AmbireFactory'

const all = {
	...UniRouters,
	...AaveLendingPoolV2,
	...ERC20,
	...ERC721,
	...WETH,
	...AmbireIdentity,
	...AmbireFactory,
}
export default all