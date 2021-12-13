const YearnVaultABI = [
    "function pricePerShare() view returns (uint256)",
    "function deposit(uint256 _amount, address recipient)",
    "function withdraw(uint256 maxShares, address recipient)",
]

export default YearnVaultABI