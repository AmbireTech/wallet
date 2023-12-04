// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

import "./libs/SignatureValidatorV2.sol";
import "./libs/MerkleProof.sol";
import "./libs/IERC20.sol";
import "./WALLET.sol";

interface IStakingPool {
	function enterTo(address recipient, uint amount) external;
}

contract WALLETSupplyController {
	event LogNewVesting(address indexed recipient, uint start, uint end, uint amountPerSec);
	event LogVestingUnset(address indexed recipient, uint end, uint amountPerSec);
	event LogMintVesting(address indexed recipient, uint amount);

	// solhint-disable-next-line var-name-mixedcase
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
		require(start >= 1643695200, "START_TOO_LOW");
		require(vestingLastMint[recipient][end][amountPerSecond] == 0, "VESTING_ALREADY_SET");
		vestingLastMint[recipient][end][amountPerSecond] = start;
		emit LogNewVesting(recipient, start, end, amountPerSecond);
	}
	function unsetVesting(address recipient, uint end, uint amountPerSecond) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// AUDIT: Pending (unclaimed) vesting is lost here - this is intentional
		vestingLastMint[recipient][end][amountPerSecond] = 0;
		emit LogVestingUnset(recipient, end, amountPerSecond);
	}

	// vesting mechanism
	function mintableVesting(address addr, uint end, uint amountPerSecond) public view returns (uint) {
		uint lastMinted = vestingLastMint[addr][end][amountPerSecond];
		if (lastMinted == 0) return 0;
		// solhint-disable-next-line not-rely-on-time
		if (block.timestamp > end) {
			require(end > lastMinted, "VESTING_OVER");
			return (end - lastMinted) * amountPerSecond;
		} else {
			// this means we have not started yet
			// solhint-disable-next-line not-rely-on-time
			if (lastMinted > block.timestamp) return 0;
			// solhint-disable-next-line not-rely-on-time
			return (block.timestamp - lastMinted) * amountPerSecond;
		}
	}

	function mintVesting(address recipient, uint end, uint amountPerSecond) external {
		uint amount = mintableVesting(recipient, end, amountPerSecond);
		// this check here is critical, as it ensures this user has a vesting entry
		if (amount > 0) {
			// solhint-disable-next-line not-rely-on-time
			vestingLastMint[recipient][end][amountPerSecond] = block.timestamp;
			WALLET.mint(recipient, amount);
			emit LogMintVesting(recipient, amount);
		}
	}

	//
	// Rewards distribution
	//
	event LogUpdatePenaltyBps(uint newPenaltyBps);
	event LogClaimStaked(address indexed recipient, uint claimed);
	event LogClaimWithPenalty(address indexed recipient, uint received, uint burned);

	uint public immutable MAX_CLAIM_NODE = 80_000_000e18;

	bytes32 public lastRoot;
	mapping (address => uint) public claimed;
	uint public penaltyBps = 0;

	function setPenaltyBps(uint _penaltyBps) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		require(penaltyBps <= 10000, "BPS_IN_RANGE");
		penaltyBps = _penaltyBps;
		emit LogUpdatePenaltyBps(_penaltyBps);
	}

	function setRoot(bytes32 newRoot) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		lastRoot = newRoot;
	}

	function claimWithRootUpdate(
		// claim() args
		uint totalRewardInTree, bytes32[] calldata proof, uint toBurnBps, IStakingPool stakingPool,
		// args for updating the root
		bytes32 newRoot, bytes calldata signature
	) external {
		address signer = SignatureValidator.recoverAddrImpl(newRoot, signature, false);
		require(hasGovernance[signer], "NOT_GOVERNANCE");
		lastRoot = newRoot;
		claim(totalRewardInTree, proof, toBurnBps, stakingPool);
	}

	// claim() has two modes, either receive the full amount as xWALLET (staked WALLET) or burn some (penaltyBps) and receive the rest immediately in $WALLET
	// toBurnBps is a safety parameter that serves two purposes:
	// 1) prevents griefing attacks/frontrunning where governance sets penalties higher before someone's claim() gets mined
	// 2) ensures that the sender really does have the intention to burn some of their tokens but receive the rest immediatey
	// set toBurnBps to 0 to receive the tokens as xWALLET, set it to the current penaltyBps to receive immediately
	// There is an edge case: when penaltyBps is set to 0, you pass 0 to receive everything immediately; this is intended
	function claim(uint totalRewardInTree, bytes32[] memory proof, uint toBurnBps, IStakingPool stakingPool) public {
		address recipient = msg.sender;

		require(totalRewardInTree <= MAX_CLAIM_NODE, "MAX_CLAIM_NODE");
		require(lastRoot != bytes32(0), "EMPTY_ROOT");

		// Check the merkle proof
		bytes32 leaf = keccak256(abi.encode(address(this), recipient, totalRewardInTree, address(stakingPool)));
		require(MerkleProof.isContained(leaf, proof, lastRoot), "LEAF_NOT_FOUND");

		uint toClaim = totalRewardInTree - claimed[recipient];
		claimed[recipient] = totalRewardInTree;

		if (toBurnBps == penaltyBps) {
			// Claiming in $WALLET directly: some tokens get burned immediately, but the rest go to you
			uint toBurn = (toClaim * penaltyBps) / 10000;
			uint toReceive = toClaim - toBurn;
			// AUDIT: We can check toReceive > 0 or toBurn > 0, but there's no point since in the most common path both will be non-zero
			WALLET.mint(recipient, toReceive);
			WALLET.mint(address(0), toBurn);
			emit LogClaimWithPenalty(recipient, toReceive, toBurn);
		} else if (toBurnBps == 0) {
			WALLET.mint(address(this), toClaim);
			if (WALLET.allowance(address(this), address(stakingPool)) < toClaim) {
				WALLET.approve(address(stakingPool), type(uint256).max);
			}
			stakingPool.enterTo(recipient, toClaim);
			emit LogClaimStaked(recipient, toClaim);
		} else {
			revert("INVALID_TOBURNBPS");
		}
	}

	// In case funds get stuck
	function withdraw(IERC20 token, address to, uint256 tokenAmount) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// AUDIT: SafeERC20 or similar not needed; this is a trusted (governance only) method that doesn't modify internal accounting
		// so sucess/fail does not matter
		token.transfer(to, tokenAmount);
	}
}
