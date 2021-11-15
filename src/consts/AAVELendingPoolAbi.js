const AAVELendingPoolAbi = [
    "function getLendingPool() view returns (address address)",
    "function getReservesList() view returns (address[] memory)",
    "function getReserveData(address asset) view returns (tuple(uint256 availableLiquidity, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp) memory)",
    "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]

export default AAVELendingPoolAbi