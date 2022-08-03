// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFT is ERC721 {
  uint public nextTokenId;
  address public admin;
  uint constant maxTokenId = 9999;
  constructor() ERC721('Ambire GasTank NFT', 'AMGT') {
    admin = msg.sender;
  }
  
  function mint(address to) external {
    require(msg.sender == admin, 'ONLY_ADMIN_CAN_MINT');
    require(nextTokenId <= maxTokenId, 'MAXIMUM_AMOUNT_OF_NFT_IS_MINTED');
    _safeMint(to, nextTokenId);
    nextTokenId++;
  }

  function mintBundle(address[] calldata addresses) external {
    require(msg.sender == admin, 'ONLY_ADMIN_CAN_MINT');
    require(nextTokenId + addresses.length - 1 <= maxTokenId, 'MAXIMUM_AMOUNT_OF_NFT_IS_MINTED');
  
    uint len = addresses.length;
    for (uint256 i = 0; i < len; i++) {
      _safeMint(addresses[i], nextTokenId);
      nextTokenId++;
    }
  }

  function _baseURI() internal view override returns (string memory) {
    return "https://nftmeta.ambire.com/gastank/";
  }

  function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");
    return string(abi.encodePacked(_baseURI(), Strings.toString(tokenId), '.json'));
  }
}