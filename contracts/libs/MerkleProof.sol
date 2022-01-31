// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

library MerkleProof {
	function isContained(bytes32 valueHash, bytes32[] memory proof, bytes32 root) internal pure returns (bool) {
		bytes32 cursor = valueHash;

		uint256 proofLen = proof.length;
		for (uint256 i = 0; i < proofLen; i++) {
			if (cursor < proof[i]) {
				cursor = keccak256(abi.encodePacked(cursor, proof[i]));
			} else {
				cursor = keccak256(abi.encodePacked(proof[i], cursor));
			}
		}

		return cursor == root;
	}
}
