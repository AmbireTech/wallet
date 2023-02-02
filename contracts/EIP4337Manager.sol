// Must inherit AmbireAccount so that it's safe to delegatecall (doesn't override storage)
import "./AmbireAccount.sol";
import "./libs/SignatureValidatorV2.sol";
import "../node_modules/accountabstraction/contracts/interfaces/IAccount.sol";
import "../node_modules/accountabstraction/contracts/interfaces/IEntryPoint.sol";

// based on Gnosis EIP4337Manager
contract AmbireEIP4337Manager is AmbireAccount, IAccount {
	address public immutable entryPoint;

	// return value in case of signature failure, with no time-range.
	// equivalent to packSigTimeRange(true,0,0);
	uint256 constant internal SIG_VALIDATION_FAILED = 1;

	// stub constructor, doesn't matter since this will be a fallback handler
	constructor(address[] memory privs, address _entryPoint) AmbireAccount(privs) {
		entryPoint = _entryPoint;
	}

	// aggregator is unused, we don't use sig aggregation
	function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, address /*aggregator*/, uint256 missingAccountFunds)
	    external override returns (uint256 sigTimeRange)
	{
		require(msg.sender == entryPoint, "account: not from entrypoint");
                address signer = SignatureValidator.recoverAddr(userOpHash, userOp.signature);
		if (privileges[signer] == bytes32(0)) {
			sigTimeRange = SIG_VALIDATION_FAILED;
		}

		if (userOp.initCode.length == 0) {
			require(nonce++ == userOp.nonce, "account: invalid nonce");
		}

		if (missingAccountFunds > 0) {
			// TODO: MAY pay more than the minimum, to deposit for future transactions
			(bool success,) = payable(msg.sender).call{value : missingAccountFunds}("");
			(success);
			// ignore failure (its EntryPoint's job to verify, not account.)
		}
	}
}
