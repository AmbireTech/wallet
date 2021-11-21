import UniV2Router from './UniV2Router'
import ERC20 from './ERC20'
import AaveLendingPoolV2 from './AaveLendingPoolV2'

export default {
	...ERC20,
	...UniV2Router,
	...AaveLendingPoolV2,
}
