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
		Schnorr,
		// WARNING: must always be last
		LastUnused
	}

	// bytes4(keccak256("isValidSignature(bytes32,bytes)"))
	bytes4 constant internal ERC1271_MAGICVALUE_BYTES32 = 0x1626ba7e;
	// secp256k1 group order
	uint256 constant internal Q = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
	uint256 constant internal HALF_Q = (Q >> 1) + 1;

	function recoverAddr(bytes32 hash, bytes memory sig) internal view returns (address) {
		return recoverAddrImpl(hash, sig, false);
	}

	function recoverAddrImpl(bytes32 hash, bytes memory sig, bool allowSpoofing) internal view returns (address) {
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
		// {sig}{verifier}{mode}
		} else if (mode == SignatureMode.Schnorr) {
			// last uint8 is for mode
			(uint signingPubKeyX, uint signature, address nonceTimesGeneratorAddress, uint8 pubKeyYParity,) = abi.decode(sig, (uint, uint, address, uint8, uint8));
			require(signingPubKeyX < HALF_Q, "Public-key x >= HALF_Q");
			// Avoid signature malleability from multiple representations for ℤ/Qℤ elts
			require(signature < Q, "signature must be reduced modulo Q");

			// Forbid trivial inputs, to avoid ecrecover edge cases. The main thing to
			// avoid is something which causes ecrecover to return 0x0: then trivial
			// signatures could be constructed with the nonceTimesGeneratorAddress input
			// set to 0x0.
			// solium-disable-next-line indentation
			require(nonceTimesGeneratorAddress != address(0) && signingPubKeyX > 0 && signature > 0 && hash > 0, "no zero inputs allowed");

			uint256 msgChallenge = uint256( // "e"
				keccak256(abi.encodePacked(
					signingPubKeyX, pubKeyYParity, hash, nonceTimesGeneratorAddress
				))
			);
			// Verify msgChallenge * signingPubKey + signature * generator ==
			//        nonce * generator
			//
			// https://ethresear.ch/t/you-can-kinda-abuse-ecrecover-to-do-ecmul-in-secp256k1-today/2384/9
			// The point corresponding to the address returned by
			// ecrecover(-s*r,v,r,e*r) is (r⁻¹ mod Q)*(e*r*R-(-s)*r*g)=e*R+s*g, where R
			// is the (v,r) point. See https://crypto.stackexchange.com/a/18106
			//
			return ecrecover(
				bytes32(Q - mulmod(signingPubKeyX, signature, Q)),
				// https://ethereum.github.io/yellowpaper/paper.pdf p. 24, "The
				// value 27 represents an even y value and 28 represents an odd
				// y value."
				(pubKeyYParity == 0) ? 27 : 28,
				bytes32(signingPubKeyX),
				bytes32(mulmod(msgChallenge, signingPubKeyX, Q))
			);
		} else if (mode == SignatureMode.SmartWallet) {
			// 32 bytes for the addr, 1 byte for the type = 33
			require(sig.length > 33, "SV_LEN_WALLET");
			uint newLen;
			unchecked {
				newLen = sig.length - 33;
			}
			IERC1271Wallet wallet = IERC1271Wallet(address(uint160(uint256(sig.readBytes32(newLen)))));
			sig.trimToSize(newLen);
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
