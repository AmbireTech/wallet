import UniV2Router from './UniV2Router'
import ERC20 from './ERC20'
import AaveLendingPoolV2 from './AaveLendingPoolV2'
import ERC721 from './ERC721'
import WETH from './WETH'

export default {
	...UniV2Router,
	...AaveLendingPoolV2,
	...ERC20,
	...ERC721,
	...WETH,
}
