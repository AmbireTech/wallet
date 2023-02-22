// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.7;

import "./libs/SignatureValidatorV2.sol";

contract AmbireAccount {
	address private constant FALLBACK_HANDLER_SLOT = address(0x6969);

	// Variables
	mapping (address => bytes32) public privileges;
	// The next allowed nonce
	uint public nonce;

	// Events
	event LogPrivilegeChanged(address indexed addr, bytes32 priv);
	event LogErr(address indexed to, uint value, bytes data, bytes returnData); // only used in tryCatch

	// Transaction structure
	// we handle replay protection separately by requiring (address(this), chainID, nonce) as part of the sig
	struct Transaction {
		address to;
		uint value;
		bytes data;
	}

	constructor(address[] memory addrs) {
		uint len = addrs.length;
		for (uint i=0; i<len; i++) {
			// NOTE: privileges[] can be set to any arbitrary value, but for this we SSTORE directly through the proxy creator
			privileges[addrs[i]] = bytes32(uint(1));
			emit LogPrivilegeChanged(addrs[i], bytes32(uint(1)));
		}
	}

	// This contract can accept ETH without calldata
	receive() external payable {}
	// To support EIP 721 and EIP 1155, we need to respond to those methods with their own method signature
	function onERC721Received(address, address, uint256, bytes memory) external pure returns (bytes4) { return this.onERC721Received.selector; }
	function onERC1155Received(address, address, uint256, uint256, bytes memory) external pure returns (bytes4) { return this.onERC1155Received.selector; }
	function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory) external pure returns (bytes4) {  return this.onERC1155BatchReceived.selector;  }

	// This contract can accept ETH with calldata
	fallback() external payable {
		// We store the fallback handler at this magic slot
		address fallbackHandler = address(uint160(uint(privileges[FALLBACK_HANDLER_SLOT])));
		if (fallbackHandler == address(0)) return;
		assembly {
			// We can use memory addr 0, since it's not occupied
			calldatacopy(0, 0, calldatasize())
			let result := delegatecall(gas(), fallbackHandler, 0, calldatasize(), 0, 0)
			let size := returndatasize()
			returndatacopy(0, 0, size)
			if eq(result, 0) { revert(0, size) }
			return(0, size)
		}
	}

	function setAddrPrivilege(address addr, bytes32 priv)
		external
	{
		require(msg.sender == address(this), 'ONLY_IDENTITY_CAN_CALL');
		// Anti-bricking measure: if the privileges slot is used for special data (not 0x01),
		// don't allow to set it to true
		if (uint(privileges[addr]) > 1) require(priv != bytes32(uint(1)), 'UNSETTING_SPECIAL_DATA');
		privileges[addr] = priv;
		emit LogPrivilegeChanged(addr, priv);
	}

	// Useful when we need to do multiple operations but ignore failures in some of them
	function tryCatch(address to, uint value, bytes calldata data)
		external
	{
		require(msg.sender == address(this), 'ONLY_IDENTITY_CAN_CALL');
		(bool success, bytes memory returnData) = to.call{value: value, gas: gasleft()}(data);
		if (!success) emit LogErr(to, value, data, returnData);
	}
	function tryCatchLimit(address to, uint value, bytes calldata data, uint gasLimit)
		external
	{
		require(msg.sender == address(this), 'ONLY_IDENTITY_CAN_CALL');
		(bool success, bytes memory returnData) = to.call{value: value, gas: gasLimit}(data);
		if (!success) emit LogErr(to, value, data, returnData);
	}

	// WARNING: if the signature of this is changed, we have to change IdentityFactory
	function execute(Transaction[] calldata txns, bytes calldata signature)
		external
	{
		uint currentNonce = nonce;
		// NOTE: abi.encode is safer than abi.encodePacked in terms of collision safety
		bytes32 hash = keccak256(abi.encode(address(this), block.chainid, currentNonce, txns));
		// We have to increment before execution cause it protects from reentrancies
		nonce = currentNonce + 1;

		address signer = SignatureValidator.recoverAddrImpl(hash, signature, true);
		require(privileges[signer] != bytes32(0), 'INSUFFICIENT_PRIVILEGE');
		executeBatch(txns);
		// The actual anti-bricking mechanism - do not allow a signer to drop their own priviledges
		require(privileges[signer] != bytes32(0), 'PRIVILEGE_NOT_DOWNGRADED');
	}

	// no need for nonce management here cause we're not dealing with sigs
	function executeBySender(Transaction[] calldata txns) external {
		require(privileges[msg.sender] != bytes32(0), 'INSUFFICIENT_PRIVILEGE');
		executeBatch(txns);
		// again, anti-bricking
		require(privileges[msg.sender] != bytes32(0), 'PRIVILEGE_NOT_DOWNGRADED');
	}

	function executeBySelf(Transaction[] calldata txns) external {
		require(msg.sender == address(this), 'ONLY_IDENTITY_CAN_CALL');
		executeBatch(txns);
	}

	function executeBatch(Transaction[] memory txns) internal {
		require(txns.length > 0, 'MUST_PASS_TX');
		uint len = txns.length;
		for (uint i=0; i<len; i++) {
			Transaction memory txn = txns[i];
			executeCall(txn.to, txn.value, txn.data);
		}
	}

	// we shouldn't use address.call(), cause: https://github.com/ethereum/solidity/issues/2884
	function executeCall(address to, uint256 value, bytes memory data)
		internal
	{
		assembly {
			let result := call(gas(), to, value, add(data, 0x20), mload(data), 0, 0)

			switch result case 0 {
				let size := returndatasize()
				let ptr := mload(0x40)
				returndatacopy(ptr, 0, size)
				revert(ptr, size)
			}
			default {}
		}
	}

	// EIP 1271 implementation
	// see https://eips.ethereum.org/EIPS/eip-1271
	function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
		if (privileges[SignatureValidator.recoverAddr(hash, signature)] != bytes32(0)) {
			// bytes4(keccak256("isValidSignature(bytes32,bytes)")
			return 0x1626ba7e;
		} else {
			return 0xffffffff;
		}
	}

	// EIP 1155 implementation
	// we pretty much only need to signal that we support the interface for 165, but for 1155 we also need the fallback function
	function supportsInterface(bytes4 interfaceID) external pure returns (bool) {
		return
			interfaceID == 0x01ffc9a7 ||    // ERC-165 support (i.e. `bytes4(keccak256('supportsInterface(bytes4)'))`).
			interfaceID == 0x4e2312e0;      // ERC-1155 `ERC1155TokenReceiver` support (i.e. `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) ^ bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
	}
}
