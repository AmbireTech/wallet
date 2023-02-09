export const COMMANDS = {
    FLAG_ALLOW_REVERT: '0x80',
    COMMAND_TYPE_MASK: '0x3f',
    V3_SWAP_EXACT_IN: '0x00',
    V3_SWAP_EXACT_OUT: '0x01',
    PERMIT2_TRANSFER_FROM: '0x02',
    // PERMIT2_PERMIT_BATCH: '0x03',
    SWEEP: '0x04',
    TRANSFER: '0x05',
    PAY_PORTION: '0x06',
    V2_SWAP_EXACT_IN: '0x08',
    V2_SWAP_EXACT_OUT: '0x09',
    // PERMIT2_PERMIT: '0x0a',
    WRAP_ETH: '0x0b',
    UNWRAP_WETH: '0x0c',
    // PERMIT2_TRANSFER_FROM_BATCH: '0x0d',
    SEAPORT: '0x10',
    // LOOKS_RARE_721: '0x11',
    NFTX: '0x12',
    CRYPTOPUNKS: '0x13',
    // LOOKS_RARE_1155: '0x14',
    OWNER_CHECK_721: '0x15',
    OWNER_CHECK_1155: '0x16',
    SWEEP_ERC721: '0x17',
    // X2Y2_721: '0x18',
    SUDOSWAP: '0x19',
    NFT20: '0x1a',
    // X2Y2_1155: '0x1b',
    // FOUNDATION: '0x1c',
    // SWEEP_ERC1155: '0x1d'
}

export const COMMANDS_DESCRIPTIONS = {
    V3_SWAP_EXACT_IN: {
        command: '0x00',
        inputs: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountIn' },
            { type: 'uint256', name: 'amountOutMin' },
            { type: 'bool', name: 'payerIsUser' }
        ]
    },
    V3_SWAP_EXACT_OUT: {
        command: '0x01',
        inputs: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountOut' },
            { type: 'uint256', name: 'amountInMax' },
            { type: 'bool', name: 'payerIsUser' }
        ]
    },
    PERMIT2_TRANSFER_FROM: {
        command: '0x02',
        inputs: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint160', name: 'amount' }
        ]
    },
    //PERMIT2_PERMIT_BATCH
    SWEEP: {
        command: '0x04',
        inputs: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint160', name: 'amountMin' }
        ]
    },
    TRANSFER: {
        command: '0x05',
        inputs: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'value' }
        ]
    },
    PAY_PORTION: {
        command: '0x06',
        inputs: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'bips' }
        ]
    },
    V2_SWAP_EXACT_IN: {
        command: '0x08',
        inputs: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountIn' },
            { type: 'uint256', name: 'amountOutMin' },
            { type: 'bool', name: 'payerIsUser' },
        ]
    },
    V2_SWAP_EXACT_OUT: {
        command: '0x09',
        inputs: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountOut' },
            { type: 'uint256', name: 'amountInMax' },
            { type: 'bool', name: 'payerIsUser' },
        ]
    },
    //PERMIT2_PERMIT: {
    //     command: '0x0a',
    //     inputs: [
    //         { type: 'address', name: 'recipient' },
    //         { type: 'uint256', name: 'amountOut' },
    //         { type: 'uint256', name: 'amountInMax' },
    //         { type: 'bool', name: 'payerIsUser' },
    //     ]
    // },
    WRAP_ETH: {
        command: '0x0b',
        inputsDetails: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountMin' }
        ]
    },
    UNWRAP_WETH: {
        command: '0x0c',
        inputsDetails: [
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'amountMin' }
        ]
    },
    SEAPORT: {
        command: '0x10',
        inputsDetails: [
            { type: 'uint256', name: 'value' }
        ]
    },
    NFTX: {
        command: '0x12',
        inputsDetails: [
            { type: 'uint256', name: 'value' }
        ]
    },
    CRYPTOPUNKS: {
        command: '0x13',
        inputsDetails: [
            { type: 'uint256', name: 'punkId' },
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'value' }
        ]
    },
    // LOOKS_RARE_1155: '0x14',
    OWNER_CHECK_721: {
        command: '0x15',
        inputsDetails: [
            { type: 'address', name: 'owner' },
            { type: 'address', name: 'token' },
            { type: 'uint256', name: 'id' }
        ]
    },
    OWNER_CHECK_1155: {
        command: '0x16',
        inputsDetails: [
            { type: 'address', name: 'owner' },
            { type: 'address', name: 'token' },
            { type: 'uint256', name: 'id' },
            { type: 'uint256', name: 'minBalance' }
        ]
    },
    SWEEP_ERC721: {
        command: '0x17',
        inputsDetails: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'id' }
        ]
    },
    // X2Y2_721: '0x18',
    SUDOSWAP: {
        command: '0x19',
        inputsDetails: [
            { type: 'uint256', name: 'value' }
        ]
    },
    NFT20: {
        command: '0x1a',
        inputsDetails: [
            { type: 'uint256', name: 'value' }
        ]
    },
    // X2Y2_1155: '0x1b',
    // FOUNDATION: '0x1c',
    SWEEP_ERC1155: {
        command: '0x1d',
        inputsDetails: [
            { type: 'address', name: 'token' },
            { type: 'address', name: 'recipient' },
            { type: 'uint256', name: 'id' },
            { type: 'uint256', name: 'amount' }
        ]
    },
}

