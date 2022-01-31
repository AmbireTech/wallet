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

contract WALLETSupplyController {
	uint public constant CAP = 1_000_000_000 * 1e18;
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
}
