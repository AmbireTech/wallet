// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.7;

contract WALLETToken {
	// Constants
	string public constant name = "Ambire Wallet";
	string public constant symbol = "WALLET";
	uint8 public constant decimals = 18;

	// Mutable variables
	uint public totalSupply;
	mapping(address => uint) balances;
	mapping(address => mapping(address => uint)) allowed;

	event Approval(address indexed owner, address indexed spender, uint amount);
	event Transfer(address indexed from, address indexed to, uint amount);

	address public supplyController;
	address public immutable PREV_TOKEN;

	constructor(address supplyControllerAddr, address prevTokenAddr) {
		supplyController = supplyControllerAddr;
		PREV_TOKEN = prevTokenAddr;
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
		supplyController = newSupplyController;
	}
}

contract WALLETSupplyController {
	uint public constant CAP = 1_000_000_000 * 1e18;
	WALLETToken public immutable WALLET;

	mapping (address => bool) public hasGovernance;
	// Some addresses (eg StakingPools) are incentivized with a certain allowance of WALLET per year
	mapping (address => uint) public incentivePerSecond;
	// Keep track of when incentive tokens were last minted for a given addr
	mapping (address => uint) public incentiveLastMint;

	constructor(WALLETToken token) {
		hasGovernance[msg.sender] = true;
		WALLET = token;
	}

	function changeSupplyController(address newSupplyController) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		WALLET.changeSupplyController(newSupplyController);
	}

	function setGovernance(address addr, bool level) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		hasGovernance[addr] = level;
	}

	function setIncentive(address addr, uint amountPerSecond) external {
		require(hasGovernance[msg.sender], "NOT_GOVERNANCE");
		// no more than 10 WALLET per second
		require(amountPerSecond <= 10e18, "AMOUNT_TOO_LARGE");
		incentiveLastMint[addr] = block.timestamp;
		incentivePerSecond[addr] = amountPerSecond;
		// AUDIT: pending incentive lost here
	}

	function innerMint(WALLETToken token, address owner, uint amount) internal {
		uint totalSupplyAfter = token.totalSupply() + amount;
		require(totalSupplyAfter <= CAP, "MINT_TOO_LARGE");
		token.mint(owner, amount);
	}
}
