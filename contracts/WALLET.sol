// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

contract WALLETToken {
	// Constants
	string public constant name = "Ambire Wallet";
	string public constant symbol = "WALLET";
	uint8 public constant decimals = 18;
	uint public constant MAX_SUPPLY = 1_000_000_000 * 1e18;

	// Mutable variables
	uint public totalSupply;
	mapping(address => uint) balances;
	mapping(address => mapping(address => uint)) allowed;

	event Approval(address indexed owner, address indexed spender, uint amount);
	event Transfer(address indexed from, address indexed to, uint amount);

	event SupplyControllerChanged(address indexed prev, address indexed current);

	address public supplyController;
	constructor(address _supplyController) {
		supplyController = _supplyController;
		emit SupplyControllerChanged(address(0), _supplyController);
	}

	function balanceOf(address owner) external view returns (uint balance) {
		return balances[owner];
	}

	function transfer(address to, uint amount) external returns (bool success) {
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

	// Supply control
	function innerMint(address owner, uint amount) internal {
		totalSupply = totalSupply + amount;
		require(totalSupply < MAX_SUPPLY, 'MAX_SUPPLY');
		balances[owner] = balances[owner] + amount;
		// Because of https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md#transfer-1
		emit Transfer(address(0), owner, amount);
	}

	function mint(address owner, uint amount) external {
		require(msg.sender == supplyController, 'NOT_SUPPLYCONTROLLER');
		innerMint(owner, amount);
	}

	function changeSupplyController(address newSupplyController) external {
		require(msg.sender == supplyController, 'NOT_SUPPLYCONTROLLER');
		// Emitting here does not follow checks-effects-interactions-logs, but it's safe anyway cause there are no external calls
		emit SupplyControllerChanged(supplyController, newSupplyController);
		supplyController = newSupplyController;
	}
}

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

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

	// In case funds get stuck
	function withdraw(IERC20 token, address to, uint256 tokenAmount) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// AUDIT: SafeERC20 or similar not needed; this is a trusted (governance only) method that doesn't modify internal accounting
		// so sucess/fail does not matter
		token.transfer(to, tokenAmount);
	}
}
