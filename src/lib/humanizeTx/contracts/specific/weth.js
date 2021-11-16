const SummaryFormatter = require('../../summaryFormatter');

module.exports = {
    description: "WETH",
    interface: {
        methods:[
            {
                name: "deposit",
                signature: '0xd0e30db0',
                summary: ({network, txn, inputs, contract}) => {
                    const SF = new SummaryFormatter(network, contract.manager).mainAction('wrap')
                    return SF.actions([
                        SF.text('Wrap')
                          .tokenAmount( 'native', txn.value)
                          .action()
                    ])
                }
            },
            {
                name: "withdraw",
                signature: '0x2e1a7d4d',
                summary: ({network, txn, inputs, contract}) => {
                    const SF = new SummaryFormatter(network, contract.manager).mainAction('unwrap')
                    return SF.actions([
                        SF.text('Unwrap')
                          .tokenAmount( 'native', inputs.wad)
                          .action()
                    ])
                }
            },
        ],
        abi: [
            {
                "constant": true,
                "inputs": [],
                "name": "name",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "guy",
                        "type": "address"
                    },
                    {
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "approve",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "totalSupply",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "src",
                        "type": "address"
                    },
                    {
                        "name": "dst",
                        "type": "address"
                    },
                    {
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "transferFrom",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "withdraw",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "decimals",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint8"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "balanceOf",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [],
                "name": "symbol",
                "outputs": [
                    {
                        "name": "",
                        "type": "string"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [
                    {
                        "name": "dst",
                        "type": "address"
                    },
                    {
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "transfer",
                "outputs": [
                    {
                        "name": "",
                        "type": "bool"
                    }
                ],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "constant": false,
                "inputs": [],
                "name": "deposit",
                "outputs": [],
                "payable": true,
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "constant": true,
                "inputs": [
                    {
                        "name": "",
                        "type": "address"
                    },
                    {
                        "name": "",
                        "type": "address"
                    }
                ],
                "name": "allowance",
                "outputs": [
                    {
                        "name": "",
                        "type": "uint256"
                    }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
            },
            {
                "payable": true,
                "stateMutability": "payable",
                "type": "fallback"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "src",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "name": "guy",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "Approval",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "src",
                        "type": "address"
                    },
                    {
                        "indexed": true,
                        "name": "dst",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "Transfer",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "dst",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "Deposit",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {
                        "indexed": true,
                        "name": "src",
                        "type": "address"
                    },
                    {
                        "indexed": false,
                        "name": "wad",
                        "type": "uint256"
                    }
                ],
                "name": "Withdrawal",
                "type": "event"
            }
        ]
    }
}
