// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

interface ISupplyController {
	function mintableVesting(address addr, uint end, uint amountPerSecond) external view returns (uint);
	function mintVesting(address recipient, uint end, uint amountPerSecond) external;
}

interface IWALLETToken {
	function transfer(address to, uint256 amount) external returns (bool);
	function transferFrom(address from, address to, uint256 amount) external returns (bool);
	function approve(address spender, uint256 amount) external returns (bool);
	function balanceOf(address spender) external view returns (uint);
	function allowance(address owner, address spender) external view returns (uint);
	function totalSupply() external returns (uint);
	function supplyController() external view returns (ISupplyController);
	// function changeSupplyController(address newSupplyController) external;
}

contract StakingPool {
	// ERC20 stuff
	// Constants
	string public constant name = "Ambire Wallet Staking Token";
	uint8 public constant decimals = 18;
	string public constant symbol = "xWALLET";

	// Mutable variables
	uint public totalSupply;
	mapping(address => uint) private balances;
	mapping(address => mapping(address => uint)) private allowed;

	// EIP 2612
	bytes32 public DOMAIN_SEPARATOR;
	// keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
	bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
	mapping(address => uint) public nonces;

	// ERC20 events
	event Approval(address indexed owner, address indexed spender, uint amount);
	event Transfer(address indexed from, address indexed to, uint amount);

	// ERC20 methods
	function balanceOf(address owner) external view returns (uint balance) {
		return balances[owner];
	}

	function transfer(address to, uint amount) external returns (bool success) {
		require(to != address(this), "BAD_ADDRESS");
		balances[msg.sender] = balances[msg.sender] - amount;
		balances[to] = balances[to] + amount;
		emit Transfer(msg.sender, to, amount);
		return true;
	}

	function transferFrom(address from, address to, uint amount) external returns (bool success) {
		balances[from] = balances[from] - amount;
		allowed[from][msg.sender] = allowed[from][msg.sender] - amount;
		balances[to] = balances[to] + amount;
		emit Transfer(from, to, amount);
		return true;
	}

	function approve(address spender, uint amount) external returns (bool success) {
		allowed[msg.sender][spender] = amount;
		emit Approval(msg.sender, spender, amount);
		return true;
	}

	function allowance(address owner, address spender) external view returns (uint remaining) {
		return allowed[owner][spender];
	}

	// EIP 2612
	function permit(address owner, address spender, uint amount, uint deadline, uint8 v, bytes32 r, bytes32 s) external {
		require(deadline >= block.timestamp, "DEADLINE_EXPIRED");
		bytes32 digest = keccak256(abi.encodePacked(
			"\x19\x01",
			DOMAIN_SEPARATOR,
			keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, nonces[owner]++, deadline))
		));
		address recoveredAddress = ecrecover(digest, v, r, s);
		require(recoveredAddress != address(0) && recoveredAddress == owner, "INVALID_SIGNATURE");
		allowed[owner][spender] = amount;
		emit Approval(owner, spender, amount);
	}

	// Inner
	function innerMint(address owner, uint amount) internal {
		totalSupply = totalSupply + amount;
		balances[owner] = balances[owner] + amount;
		// Because of https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#transfer-1
		emit Transfer(address(0), owner, amount);
	}
	function innerBurn(address owner, uint amount) internal {
		totalSupply = totalSupply - amount;
		balances[owner] = balances[owner] - amount;
		emit Transfer(owner, address(0), amount);
	}

	// Pool functionality
	uint public timeToUnbond = 20 days;
	uint public rageReceivedPromilles = 700;
	// Vesting parameters
	// we call .mintVesting to get the additional incentive tokens for this pool
	uint public vestingEnd = 1675576800;
	uint public vestingAmountPerSec = 1268391679350580000;

	IWALLETToken public immutable WALLET;
	address public governance;

	// Commitment ID against the max amount of tokens it will pay out
	mapping (bytes32 => uint) public commitments;
	// How many of a user's shares are locked
	mapping (address => uint) public lockedShares;
	// Unbonding commitment from a staker
	struct UnbondCommitment {
		address owner;
		uint shares;
		uint unlocksAt;
	}

	// Staking pool events
	// LogLeave/LogWithdraw must begin with the UnbondCommitment struct
	event LogLeave(address indexed owner, uint shares, uint unlocksAt, uint maxTokens);
	event LogWithdraw(address indexed owner, uint shares, uint unlocksAt, uint maxTokens, uint receivedTokens);
	event LogRageLeave(address indexed owner, uint shares, uint maxTokens, uint receivedTokens);

	constructor(IWALLETToken token, address governanceAddr) {
		WALLET = token;
		governance = governanceAddr;

		// EIP 2612
		uint chainId;
		assembly {
			chainId := chainid()
		}
		DOMAIN_SEPARATOR = keccak256(
			abi.encode(
				keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
				keccak256(bytes(name)),
				keccak256(bytes("1")),
				chainId,
				address(this)
			)
		);
	}

	// Governance functions
	function setGovernance(address addr) external {
		require(governance == msg.sender, "NOT_GOVERNANCE");
		governance = addr;
	}
	function setRageReceived(uint rageReceived) external {
		require(governance == msg.sender, "NOT_GOVERNANCE");
		// AUDIT: should there be a minimum here?
		require(rageReceived <= 1000, "TOO_LARGE");
		rageReceivedPromilles = rageReceived;
	}
	function setTimeToUnbond(uint time) external {
		require(governance == msg.sender, "NOT_GOVERNANCE");
		require(time >= 1 days && time <= 30 days, "BOUNDS");
		timeToUnbond = time;
	}
	function setVestingParams(uint end, uint amountPerSecond) external {
		require(governance == msg.sender, "NOT_GOVERNANCE");
		vestingEnd = end;
		vestingAmountPerSec = amountPerSecond;
	}

	// Pool stuff
	function shareValue() external view returns (uint) {
		if (totalSupply == 0) return 0;
		return ((WALLET.balanceOf(address(this)) + WALLET.supplyController().mintableVesting(address(this), vestingEnd, vestingAmountPerSec))
			* 1e18)
			/ totalSupply;
	}

	function innerEnter(address recipient, uint amount) internal {
		// Please note that minting has to be in the beginning so that we take it into account
		// when using IWALLETToken.balanceOf()
		// Minting makes an external call but it"s to a trusted contract (IIWALLETToken)
		WALLET.supplyController().mintVesting(address(this), vestingEnd, vestingAmountPerSec);

		uint totalWALLET = WALLET.balanceOf(address(this));

		// The totalWALLET == 0 check here should be redudnant; the only way to get totalSupply to a nonzero val is by adding WALLET
		if (totalSupply == 0 || totalWALLET == 0) {
			innerMint(recipient, amount);
		} else {
			uint256 newShares = (amount * totalSupply) / totalWALLET;
			innerMint(recipient, newShares);
		}
		// AUDIT: no need to check return value cause WALLET throws
		WALLET.transferFrom(msg.sender, address(this), amount);
		// no events, as innerMint already emits enough to know the shares amount and price
	}

	function enter(uint amount) external {
		innerEnter(msg.sender, amount);
	}

	function enterTo(address recipient, uint amount) external {
		innerEnter(recipient, amount);
	}

	function unbondingCommitmentWorth(address owner, uint shares, uint unlocksAt) external view returns (uint) {
		if (totalSupply == 0) return 0;
		bytes32 commitmentId = keccak256(abi.encode(UnbondCommitment({ owner: owner, shares: shares, unlocksAt: unlocksAt })));
		uint maxTokens = commitments[commitmentId];
		uint totalWALLET = WALLET.balanceOf(address(this));
		uint currentTokens = (shares * totalWALLET) / totalSupply;
		return currentTokens > maxTokens ? maxTokens : currentTokens;
	}

	function leave(uint shares, bool skipMint) external {
		if (!skipMint) WALLET.supplyController().mintVesting(address(this), vestingEnd, vestingAmountPerSec);

		require(shares <= balances[msg.sender] - lockedShares[msg.sender], "INSUFFICIENT_SHARES");
		uint totalWALLET = WALLET.balanceOf(address(this));
		uint maxTokens = (shares * totalWALLET) / totalSupply;
		uint unlocksAt = block.timestamp + timeToUnbond;
		bytes32 commitmentId = keccak256(abi.encode(UnbondCommitment({ owner: msg.sender, shares: shares, unlocksAt: unlocksAt })));
		require(commitments[commitmentId] == 0, "COMMITMENT_EXISTS");

		commitments[commitmentId] = maxTokens;
		lockedShares[msg.sender] += shares;

		emit LogLeave(msg.sender, shares, unlocksAt, maxTokens);
	}

	function withdraw(uint shares, uint unlocksAt, bool skipMint) external {
		if (!skipMint) WALLET.supplyController().mintVesting(address(this), vestingEnd, vestingAmountPerSec);

		require(block.timestamp > unlocksAt, "UNLOCK_TOO_EARLY");
		bytes32 commitmentId = keccak256(abi.encode(UnbondCommitment({ owner: msg.sender, shares: shares, unlocksAt: unlocksAt })));
		uint maxTokens = commitments[commitmentId];
		require(maxTokens > 0, "NO_COMMITMENT");
		uint totalWALLET = WALLET.balanceOf(address(this));
		uint currentTokens = (shares * totalWALLET) / totalSupply;
		uint receivedTokens = currentTokens > maxTokens ? maxTokens : currentTokens;

		commitments[commitmentId] = 0;
		lockedShares[msg.sender] -= shares;

		innerBurn(msg.sender, shares);
		// AUDIT: no need to check return value cause WALLET throws
		WALLET.transfer(msg.sender, receivedTokens);

		emit LogWithdraw(msg.sender, shares, unlocksAt, maxTokens, receivedTokens);
	}

	function rageLeave(uint shares, bool skipMint) external {
		if (!skipMint) WALLET.supplyController().mintVesting(address(this), vestingEnd, vestingAmountPerSec);

		uint totalWALLET = WALLET.balanceOf(address(this));
		uint walletAmount = (shares * totalWALLET) / totalSupply;
		uint receivedTokens = (walletAmount * rageReceivedPromilles) / 1000;
		innerBurn(msg.sender, shares);
		// AUDIT: no need to check return value cause WALLET throws
		WALLET.transfer(msg.sender, receivedTokens);

		emit LogRageLeave(msg.sender, shares, walletAmount, receivedTokens);
	}
}
