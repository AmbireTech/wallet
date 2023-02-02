// SPDX-License-Identifier: agpl-3.0
pragma solidity ^0.8.7;

import "./BytesLib.sol";

interface IERC1271Wallet {
	function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4 magicValue);
}

library SignatureValidator {
	using LibBytes for bytes;

	enum SignatureMode {
		EIP712,
		EthSign,
		SmartWallet,
		Spoof,
		// WARNING: must always be last
		LastUnused
	}

	// bytes4(keccak256("isValidSignature(bytes32,bytes)"))
	bytes4 constant internal ERC1271_MAGICVALUE_BYTES32 = 0x1626ba7e;

	function recoverAddr(bytes32 hash, bytes memory sig) internal returns (address) {
		return recoverAddrImpl(hash, sig, false);
	}

	// In order to support different signature modes including EIP1271, we wrap all the signatures in a format that ends in the sig mode
	// If the sig mode is EIP1271, the wrapping format also includes the account address
	function recoverAddrImpl(bytes32 hash, bytes memory sig, bool allowSpoofing) internal returns (address) {
		require(sig.length >= 1, "SV_SIGLEN");
		uint8 modeRaw;
		unchecked { modeRaw = uint8(sig[sig.length - 1]); }
		// Ensure we're in bounds for mode; Solidity does this as well but it will just silently blow up rather than showing a decent error
		require(modeRaw < uint8(SignatureMode.LastUnused), "SV_SIGMODE");
		SignatureMode mode = SignatureMode(modeRaw);

		// {r}{s}{v}{mode}
		if (mode == SignatureMode.EIP712 || mode == SignatureMode.EthSign) {
			require(sig.length == 66, "SV_LEN");
			bytes32 r = sig.readBytes32(0);
			bytes32 s = sig.readBytes32(32);
			uint8 v = uint8(sig[64]);
			// Hesitant about this check: seems like this is something that has no business being checked on-chain
			require(v == 27 || v == 28, "SV_INVALID_V");
			if (mode == SignatureMode.EthSign) hash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
			address signer = ecrecover(hash, v, r, s);
			require(signer != address(0), "SV_ZERO_SIG");
			return signer;
		// {sig}{account}{mode}
		} else if (mode == SignatureMode.SmartWallet) {
			// 32 bytes for the addr, 1 byte for the type = 33
			require(sig.length > 33, "SV_LEN_WALLET");
			uint newLen;
			unchecked {
				newLen = sig.length - 33;
			}			
			address walletAddr = address(uint160(uint256(sig.readBytes32(newLen))));
			sig.trimToSize(newLen);

			// counterfactual deployment
			uint size;
			assembly { size := extcodesize(walletAddr) }
			if (size == 0) {
				unchecked { newLen  = sig.length - 32; }
				// signature ends in magic bytes (0x6969...6969)
				if (sig.readBytes32(newLen) != bytes32(0x6969696969696969696969696969696969696969696969696969696969696969)) return address(0);
				sig.trimToSize(newLen);
				address create2Factory;
				bytes memory factoryCalldata;
				(create2Factory, factoryCalldata, sig) = abi.decode(sig, (address, bytes, bytes));
				(bool success, ) = create2Factory.call(factoryCalldata);
				if (!success) return address(0);
				// continue as usual
			}
			// end of counterfactual deployment

			IERC1271Wallet wallet = IERC1271Wallet(walletAddr);
			require(ERC1271_MAGICVALUE_BYTES32 == wallet.isValidSignature(hash, sig), "SV_WALLET_INVALID");
			return address(wallet);
		// {address}{mode}; the spoof mode is used when simulating calls
		} else if (mode == SignatureMode.Spoof && allowSpoofing) {
			// This is safe cause it's specifically intended for spoofing sigs in simulation conditions, where tx.origin can be controlled
			// slither-disable-next-line tx-origin
			require(tx.origin == address(1), "SV_SPOOF_ORIGIN");
			require(sig.length == 33, "SV_SPOOF_LEN");
			sig.trimToSize(32);
			return abi.decode(sig, (address));
		}
		// should be impossible to get here
		return address(0);
	}
}
