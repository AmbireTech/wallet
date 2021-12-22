const TesseractVaultABI = [
    "function token() view returns (address)",
    "function deposit(uint256 _amount, address recipient)",
    "function withdraw(uint256 maxShares, address recipient)",
    "function pricePerShare() view returns (uint256)",
]

export default TesseractVaultABI