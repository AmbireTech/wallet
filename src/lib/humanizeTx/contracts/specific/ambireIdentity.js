const SummaryFormatter = require('../../summaryFormatter')
const BigNumber = require('bignumber.js')

module.exports = {
  description: 'AmbireIdentity',
  interface: {
    methods: [
      {
        name: 'setAddrPrivilege',
        signature: '0x0d5828d4',
        summary: ({network, txn, inputs, contract}) => {
          const grant = new BigNumber(inputs.priv).eq(1)
          const revoke = new BigNumber(inputs.priv).eq(0)
          const passphrase = !(grant || revoke)
          if (grant) {
            const SF = new SummaryFormatter(network, contract.manager).mainAction('authenticate')
            return SF.actions([
              SF.text('Authenticate signer')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          } else if (revoke) {
            const SF = new SummaryFormatter(network, contract.manager).mainAction('revoke')
            return SF.actions([
              SF.text('Revoke signer')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          } else {
            const SF = new SummaryFormatter(network, contract.manager).mainAction('ambire_update_passphrase')
            return SF.actions([
              SF.text('Add email/passphrase to')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          }
        }
      },
    ],
    abi: [{
      'inputs': [{'internalType': 'address[]', 'name': 'addrs', 'type': 'address[]'}],
      'stateMutability': 'nonpayable',
      'type': 'constructor'
    }, {
      'anonymous': false,
      'inputs': [{'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address'}, {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }, {'indexed': false, 'internalType': 'bytes', 'name': 'data', 'type': 'bytes'}, {
        'indexed': false,
        'internalType': 'bytes',
        'name': 'returnData',
        'type': 'bytes'
      }],
      'name': 'LogErr',
      'type': 'event'
    }, {
      'anonymous': false,
      'inputs': [{'indexed': true, 'internalType': 'address', 'name': 'addr', 'type': 'address'}, {
        'indexed': false,
        'internalType': 'bytes32',
        'name': 'priv',
        'type': 'bytes32'
      }],
      'name': 'LogPrivilegeChanged',
      'type': 'event'
    }, {'stateMutability': 'payable', 'type': 'fallback'}, {
      'inputs': [{
        'components': [{
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        }, {'internalType': 'uint256', 'name': 'value', 'type': 'uint256'}, {
          'internalType': 'bytes',
          'name': 'data',
          'type': 'bytes'
        }], 'internalType': 'struct Identity.Transaction[]', 'name': 'txns', 'type': 'tuple[]'
      }, {'internalType': 'bytes', 'name': 'signature', 'type': 'bytes'}],
      'name': 'execute',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    }, {
      'inputs': [{
        'components': [{
          'internalType': 'address',
          'name': 'to',
          'type': 'address'
        }, {'internalType': 'uint256', 'name': 'value', 'type': 'uint256'}, {
          'internalType': 'bytes',
          'name': 'data',
          'type': 'bytes'
        }], 'internalType': 'struct Identity.Transaction[]', 'name': 'txns', 'type': 'tuple[]'
      }], 'name': 'executeBySender', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function'
    }, {
      'inputs': [{'internalType': 'bytes32', 'name': 'hash', 'type': 'bytes32'}, {
        'internalType': 'bytes',
        'name': 'signature',
        'type': 'bytes'
      }],
      'name': 'isValidSignature',
      'outputs': [{'internalType': 'bytes4', 'name': '', 'type': 'bytes4'}],
      'stateMutability': 'view',
      'type': 'function'
    }, {
      'inputs': [],
      'name': 'nonce',
      'outputs': [{'internalType': 'uint256', 'name': '', 'type': 'uint256'}],
      'stateMutability': 'view',
      'type': 'function'
    }, {
      'inputs': [{'internalType': 'address', 'name': '', 'type': 'address'}],
      'name': 'privileges',
      'outputs': [{'internalType': 'bytes32', 'name': '', 'type': 'bytes32'}],
      'stateMutability': 'view',
      'type': 'function'
    }, {
      'inputs': [{'internalType': 'address', 'name': 'addr', 'type': 'address'}, {
        'internalType': 'bytes32',
        'name': 'priv',
        'type': 'bytes32'
      }], 'name': 'setAddrPrivilege', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function'
    }, {
      'inputs': [{'internalType': 'bytes4', 'name': 'interfaceID', 'type': 'bytes4'}],
      'name': 'supportsInterface',
      'outputs': [{'internalType': 'bool', 'name': '', 'type': 'bool'}],
      'stateMutability': 'pure',
      'type': 'function'
    }, {
      'inputs': [{'internalType': 'uint256', 'name': 'amount', 'type': 'uint256'}],
      'name': 'tipMiner',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    }, {
      'inputs': [{'internalType': 'address', 'name': 'to', 'type': 'address'}, {
        'internalType': 'uint256',
        'name': 'value',
        'type': 'uint256'
      }, {'internalType': 'bytes', 'name': 'data', 'type': 'bytes'}],
      'name': 'tryCatch',
      'outputs': [],
      'stateMutability': 'nonpayable',
      'type': 'function'
    }, {'stateMutability': 'payable', 'type': 'receive'}]
  }
}
