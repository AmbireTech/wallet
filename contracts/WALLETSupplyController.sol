// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

import "./libs/SignatureValidatorV2.sol";
import "./libs/MerkleProof.sol";
import "./libs/IERC20.sol";
import "./WALLET.sol";

contract WALLETSupplyController {
	WALLETToken public immutable WALLET;
	mapping (address => bool) public hasGovernance;

	constructor(WALLETToken token, address initialGovernance) {
		hasGovernance[initialGovernance] = true;
		WALLET = token;
	}

	// Governance and supply controller
	function changeSupplyController(address newSupplyController) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		WALLET.changeSupplyController(newSupplyController);
	}

	function setGovernance(address addr, bool level) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// Sometimes we need to get someone to de-auth themselves, but 
		// it's better to protect against bricking rather than have this functionality
		// we can burn conrtol by transferring control over to a contract that can't mint or by ypgrading the supply controller
		require(msg.sender != addr, "CANNOT_MODIFY_SELF");
		hasGovernance[addr] = level;
	}

	// Vesting
	// Some addresses (eg StakingPools) are incentivized with a certain allowance of WALLET per year
	// Also used for linear vesting of early supporters, team, etc.
	// mapping of (addr => end => rate) => lastMintTime;
	mapping (address => mapping(uint => mapping(uint => uint))) public vestingLastMint;
	function setVesting(address recipient, uint start, uint end, uint amountPerSecond) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// no more than 10 WALLET per second; theoretical emission max should be ~8 WALLET
		require(amountPerSecond <= 10e18, "AMOUNT_TOO_LARGE");
		vestingLastMint[recipient][end][amountPerSecond] = start;
		// AUDIT: pending vesting lost here; that's on purpose
	}
	function unsetVesting(address recipient, uint end, uint amountPerSecond) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		vestingLastMint[recipient][end][amountPerSecond] = 0;
		// @TODO logs
	}

	// vesting mechanism
	function mintableVesting(address addr, uint end, uint amountPerSecond) public view returns (uint) {
		uint lastMinted = vestingLastMint[addr][end][amountPerSecond];
		if (lastMinted == 0) return 0;
		if (block.timestamp > end) {
			require(end > lastMinted, "VESTING_OVER");
			return (end - lastMinted) * amountPerSecond;
		} else {
			return (block.timestamp - lastMinted) * amountPerSecond;
		}
	}

	function mintVesting(address addr, uint end, uint amountPerSecond) external {
		uint amount = mintableVesting(addr, end, amountPerSecond);
		vestingLastMint[addr][end][amountPerSecond] = block.timestamp;
		WALLET.mint(addr, amount);
	}

	// Rewards distribution
	bytes32 public lastRoot;
  mapping (address => uint) public claimed;

  // @TODO remove this
	function setRoot(bytes32 newRoot) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		lastRoot = newRoot;
		// @TODO: logs?
	}
  /*

  function claimWithRootUpdate(address recipient, TreeNode node, bytes32 newRoot, bytes signature) external {
		address signer = SignatureValidator.recoverAddrImpl(newRoot, signature, false);
		require(hasGovernance[signer], "NOT_GOVERNANCE");
    lastRoot = newRoot;

  }

  function claim(address recipient, TreeNode node) external {
		// Check the merkle proof
		bytes32 balanceLeaf = keccak256(abi.encode(earner, node.balanceTreeAmount));
		require(MerkleProof.isContained(balanceLeaf, withdrawal.proof, withdrawal.stateRoot), 'BALANCERLEAF_NOT_FOUND');

		uint toWithdraw = withdrawal.balanceTreeAmount - withdrawnPerUser[channelId][earner];

		// Update storage
		withdrawnPerUser[channelId][earner] = withdrawal.balanceTreeAmount;

  	WALLET.mint(addr, amount);

  }
  */

	// In case funds get stuck
	function withdraw(IERC20 token, address to, uint256 tokenAmount) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// AUDIT: SafeERC20 or similar not needed; this is a trusted (governance only) method that doesn't modify internal accounting
		// so sucess/fail does not matter
		token.transfer(to, tokenAmount);
	}
}
