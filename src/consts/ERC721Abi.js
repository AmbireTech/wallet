const ERC721Abi = [
    "function name() view returns (string memory)",
    "function tokenURI(uint256 _tokenId) view returns (string memory)",
    "function uri(uint256 _tokenId) view returns (string memory)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function transferFrom(address from, address to, uint256 tokenId)"
]

export default ERC721Abi
