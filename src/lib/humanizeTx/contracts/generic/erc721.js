const SummaryFormatter = require('../../summaryFormatter')

module.exports = {
  name: 'ERC721',
  interface: {
    methods: [
      {
        name: 'approve',
        signature: '0x095ea7b3',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager)
          return SF.actions([
            SF.text(`Approve Token #${inputs.tokenId} to be transfered by`)
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      /*{
          name: 'setApprovalForAll',
          summary: ({network, txn, inputs, contract}) => {
              let action
              if(inputs.approved){
                  action = `Approve ${contract.alias( txn.from, inputs.to)} to be transfer all the tokens ${contract.alias( txn.from, inputs.to)}`
              }else{
                  action = `Deny ${contract.alias( txn.from, inputs.to)} to be transfer all the tokens ${contract.alias( txn.from, inputs.to)}`
              }
              return [
                  action
              ]
          }
      },*/
      {
        name: 'transferFrom',
        signature: '0x23b872dd',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs.tokenId} from`)
              .alias(txn.from, inputs.from)
              .text('to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'safeTransferFrom',//how many cases exist with same methodName and different signature?
        signature: '0x42842e0e',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs.tokenId} from`)
              .alias(txn.from, inputs.from)
              .text('to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {//NOT AN ERC721 STANDARD???
        name: 'transfer',
        signature: '0xa9059cbb',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs._tokenId} to`)
              .alias(txn.from, inputs._to)
              .action()
          ])
        }
      }
    ],
    abi: [
      {
        'inputs': [],
        'stateMutability': 'nonpayable',
        'type': 'constructor'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'owner',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'approved',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'Approval',
        'type': 'event'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'owner',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'operator',
            'type': 'address'
          },
          {
            'indexed': false,
            'internalType': 'bool',
            'name': 'approved',
            'type': 'bool'
          }
        ],
        'name': 'ApprovalForAll',
        'type': 'event'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'previousOwner',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'newOwner',
            'type': 'address'
          }
        ],
        'name': 'OwnershipTransferred',
        'type': 'event'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': false,
            'internalType': 'address',
            'name': 'account',
            'type': 'address'
          }
        ],
        'name': 'Paused',
        'type': 'event'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'from',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'indexed': true,
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'Transfer',
        'type': 'event'
      },
      {
        'anonymous': false,
        'inputs': [
          {
            'indexed': false,
            'internalType': 'address',
            'name': 'account',
            'type': 'address'
          }
        ],
        'name': 'Unpaused',
        'type': 'event'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'approve',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'owner',
            'type': 'address'
          }
        ],
        'name': 'balanceOf',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'burn',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'getApproved',
        'outputs': [
          {
            'internalType': 'address',
            'name': '',
            'type': 'address'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'owner',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'operator',
            'type': 'address'
          }
        ],
        'name': 'isApprovedForAll',
        'outputs': [
          {
            'internalType': 'bool',
            'name': '',
            'type': 'bool'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'name',
        'outputs': [
          {
            'internalType': 'string',
            'name': '',
            'type': 'string'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'owner',
        'outputs': [
          {
            'internalType': 'address',
            'name': '',
            'type': 'address'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'ownerOf',
        'outputs': [
          {
            'internalType': 'address',
            'name': '',
            'type': 'address'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'pause',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'paused',
        'outputs': [
          {
            'internalType': 'bool',
            'name': '',
            'type': 'bool'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'renounceOwnership',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          },
          {
            'internalType': 'string',
            'name': 'uri',
            'type': 'string'
          }
        ],
        'name': 'safeMint',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'from',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'safeTransferFrom',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'constant': false,
        'inputs': [
          {'name': '_to', 'type': 'address'},
          {'name': '_tokenId', 'type': 'uint256'}
        ], 'name': 'transfer',
        'outputs': [],
        'payable': false,
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      /*{
          'inputs': [
              {
                  'internalType': 'address',
                  'name': 'from',
                  'type': 'address'
              },
              {
                  'internalType': 'address',
                  'name': 'to',
                  'type': 'address'
              },
              {
                  'internalType': 'uint256',
                  'name': 'tokenId',
                  'type': 'uint256'
              },
              {
                  'internalType': 'bytes',
                  'name': '_data',
                  'type': 'bytes'
              }
          ],
          'name': 'safeTransferFrom',
          'outputs': [],
          'stateMutability': 'nonpayable',
          'type': 'function'
      },*/
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'operator',
            'type': 'address'
          },
          {
            'internalType': 'bool',
            'name': 'approved',
            'type': 'bool'
          }
        ],
        'name': 'setApprovalForAll',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'bytes4',
            'name': 'interfaceId',
            'type': 'bytes4'
          }
        ],
        'name': 'supportsInterface',
        'outputs': [
          {
            'internalType': 'bool',
            'name': '',
            'type': 'bool'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'symbol',
        'outputs': [
          {
            'internalType': 'string',
            'name': '',
            'type': 'string'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'index',
            'type': 'uint256'
          }
        ],
        'name': 'tokenByIndex',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'owner',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'index',
            'type': 'uint256'
          }
        ],
        'name': 'tokenOfOwnerByIndex',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'tokenURI',
        'outputs': [
          {
            'internalType': 'string',
            'name': '',
            'type': 'string'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'totalSupply',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': '',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'from',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'tokenId',
            'type': 'uint256'
          }
        ],
        'name': 'transferFrom',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'newOwner',
            'type': 'address'
          }
        ],
        'name': 'transferOwnership',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'unpause',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      }
    ]
  },
}
