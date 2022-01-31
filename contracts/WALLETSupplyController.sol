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
  uint public penaltyBps = 0;

  function setPenaltyBps(uint _penaltyBps) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
    require(penaltyBps <= 10000, "BPS_IN_RANGE");
    penaltyBps = _penaltyBps;
    // @TODO logs
  }

  function setRoot(bytes32 newRoot) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		lastRoot = newRoot;
		// @TODO: logs?
	}

  function claimWithRootUpdate(
    // claim() args
    address recipient, uint totalRewardInTree, bytes32[] calldata proof, uint toBurnBps,
    // args for updating the root
    bytes32 newRoot, bytes calldata signature
  ) external {
    address signer = SignatureValidator.recoverAddrImpl(newRoot, signature, false);
    require(hasGovernance[signer], "NOT_GOVERNANCE");
    lastRoot = newRoot;
    claim(recipient, totalRewardInTree, proof, toBurnBps);
  }

  // claim() has two modes, either receive the full amount as xWALLET (staked WALLET) or burn some (penaltyBps) and receive the rest immediately in $WALLET
  // toBurnBps is a safety parameter that serves two purposes:
  // 1) prevents griefing attacks/frontrunning where governance sets penalties higher before someone's claim() gets mined
  // 2) ensures that the sender really does have the intention to burn some of their tokens but receive the rest immediatey
  // set toBurnBps to 0 to receive the tokens as xWALLET, set it to the current penaltyBps to receive immediately
  // There is an edge case: when penaltyBps is set to 0, you pass 0 to receive everything immediately; this is intended
  function claim(address recipient, uint totalRewardInTree, bytes32[] memory proof, uint toBurnBps) public {
    // Check the merkle proof
    bytes32 leaf = keccak256(abi.encode(recipient, totalRewardInTree));
    require(MerkleProof.isContained(leaf, proof, lastRoot), "LEAF_NOT_FOUND");

    uint toClaim = totalRewardInTree - claimed[recipient];
    claimed[recipient] = totalRewardInTree;

    if (toBurnBps == penaltyBps) {
      // Claiming in $WALLET directly: some tokens get burned immediately, but the rest go to you
      // @TODO penalty
      WALLET.mint(recipient, toClaim);
    } else if (toBurnBps == 0) {
      // @TODO stake
      WALLET.mint(recipient, toClaim);
    } else {
      revert("INVALID_TOBURNBPS");
    }

    // @TODO: special logs here?
  }

  // In case funds get stuck
  function withdraw(IERC20 token, address to, uint256 tokenAmount) external {
    require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
    // AUDIT: SafeERC20 or similar not needed; this is a trusted (governance only) method that doesn't modify internal accounting
    // so sucess/fail does not matter
    token.transfer(to, tokenAmount);
  }
}
