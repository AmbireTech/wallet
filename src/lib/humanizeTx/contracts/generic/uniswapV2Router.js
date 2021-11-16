const SummaryFormatter = require('../../summaryFormatter')

module.exports = {
  name: 'UniswapV2Router02',
  interface: {
    methods: [
      ////////////////////////////////
      /////   ADDING LIQUIDITY
      ////////////////////////////////
      {
        name: 'addLiquidity',
        signature: '0xe8e33700',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('addLiquidity')
          return SF.actions([
            SF.text('Add liquidity for')
              .tokenAmount(inputs.amountAMin, inputs.tokenA)
              .text('and')
              .tokenAmount(inputs.amountBMin, inputs.tokenB)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'addLiquidityETH',
        signature: '0xf305d719',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('addLiquidity')
          return SF.actions([
            SF.text('Add liquidity for')
              .tokenAmount(inputs.amountETHMin, 'native')
              .text('and')
              .tokenAmount(inputs.amountTokenMin, inputs.token)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },

      ////////////////////////////////
      /////   REMOVING LIQUIDITY
      ////////////////////////////////
      {
        name: 'removeLiquidity',
        signature: '0xbaa2abde',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity for')
              .tokenAmount(inputs.amountAMin, inputs.tokenA)
              .text('and')
              .tokenAmount(inputs.amountBMin, inputs.tokenB)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'removeLiquidityETH',
        signature: '0x02751cec',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity for')
              .tokenAmount(inputs.amountETHMin, 'native')
              .text('and')
              .tokenAmount(inputs.amountTokenMin, inputs.token)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'removeLiquidityWithPermit',
        signature: '0x2195995c',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity with permit for')
              .tokenAmount(inputs.amountAMin, inputs.tokenA)
              .text('and')
              .tokenAmount(inputs.amountBMin, inputs.tokenB)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'removeLiquidityETHWithPermit',
        signature: '0xded9382a',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity with permit for')
              .tokenAmount(inputs.amountETHMin, 'native')
              .text('and')
              .tokenAmount(inputs.amountTokenMin, inputs.token)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'removeLiquidityETHSupportingFeeOnTransferTokens',
        signature: '0xaf2979eb',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity for')
              .tokenAmount(inputs.amountETHMin, 'native')
              .text('and')
              .tokenAmount(inputs.amountTokenMin, inputs.token)
              .text('(deducting token fees)')
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens',
        signature: '0x5b0d5984',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('removeLiquidity')
          return SF.actions([
            SF.text('Remove liquidity with permit for')
              .tokenAmount(inputs.amountETHMin, 'native')
              .text('and')
              .tokenAmount(inputs.amountTokenMin, inputs.token)
              .text('(deducting token fees)')
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },

      ////////////////////////////////
      /////   SWAPS
      ////////////////////////////////
      {
        name: 'swapExactTokensForTokens',
        signature: '0x38ed1739',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], txn.amountIn)
              .text('for at least')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOutMin)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'swapTokensForExactTokens',
        signature: '0x8803dbee',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], txn.amountInMax)
              .text('maximum for')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOut)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'swapExactETHForTokens',
        signature: '0x7ff36ab5',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount('native', txn.value)
              .text('for at least')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOutMin)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'swapTokensForExactETH',
        signature: '0x4a25d94a',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], inputs.amountIn)
              .text('maximum for')
              .tokenAmount('native', inputs.amountOut)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'swapExactTokensForETH',
        signature: '0x18cbafe5',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], inputs.amountIn)
              .text('for at least')
              .tokenAmount('native', inputs.amountOutMin)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'swapETHForExactTokens',
        signature: '0xfb3bdb41',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount('native', txn.value)
              .text('maximum for')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOut)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },

      {
        name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
        signature: '0x5c11d795',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], txn.amountIn)
              .text('for at least')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOutMin)
              .text('(deducting fees)')
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },

      {
        name: 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        signature: '0xb6f9de95',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount('native', txn.value)
              .text('for at least')
              .tokenAmount(inputs.path[inputs.path.length - 1], inputs.amountOutMin)
              .text('(token fees deducted)')
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },

      {
        name: 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        signature: '0x791ac947',
        summary: ({network, txn, inputs, contract}) => {
          const SF = new SummaryFormatter(network, contract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.path[0], txn.value)
              .text('for at least')
              .tokenAmount('native', inputs.amountOutMin)
              .text('(deducting fees)')
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
    ],
    abi: [
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': '_factory',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': '_WETH',
            'type': 'address'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'constructor'
      },
      {
        'inputs': [],
        'name': 'WETH',
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
            'name': 'tokenA',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'tokenB',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'amountADesired',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountBDesired',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountAMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountBMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'addLiquidity',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountA',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountB',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'token',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenDesired',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETHMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'addLiquidityETH',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountToken',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETH',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'payable',
        'type': 'function'
      },
      {
        'inputs': [],
        'name': 'factory',
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
            'name': 'amountOut',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveOut',
            'type': 'uint256'
          }
        ],
        'name': 'getAmountIn',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'pure',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveOut',
            'type': 'uint256'
          }
        ],
        'name': 'getAmountOut',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOut',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'pure',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOut',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          }
        ],
        'name': 'getAmountsIn',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          }
        ],
        'name': 'getAmountsOut',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'view',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountA',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveA',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'reserveB',
            'type': 'uint256'
          }
        ],
        'name': 'quote',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountB',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'pure',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'tokenA',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'tokenB',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountAMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountBMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'removeLiquidity',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountA',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountB',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'token',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETHMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'removeLiquidityETH',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountToken',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETH',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'token',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETHMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'removeLiquidityETHSupportingFeeOnTransferTokens',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountETH',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'token',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETHMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          },
          {
            'internalType': 'bool',
            'name': 'approveMax',
            'type': 'bool'
          },
          {
            'internalType': 'uint8',
            'name': 'v',
            'type': 'uint8'
          },
          {
            'internalType': 'bytes32',
            'name': 'r',
            'type': 'bytes32'
          },
          {
            'internalType': 'bytes32',
            'name': 's',
            'type': 'bytes32'
          }
        ],
        'name': 'removeLiquidityETHWithPermit',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountToken',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETH',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'token',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountTokenMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountETHMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          },
          {
            'internalType': 'bool',
            'name': 'approveMax',
            'type': 'bool'
          },
          {
            'internalType': 'uint8',
            'name': 'v',
            'type': 'uint8'
          },
          {
            'internalType': 'bytes32',
            'name': 'r',
            'type': 'bytes32'
          },
          {
            'internalType': 'bytes32',
            'name': 's',
            'type': 'bytes32'
          }
        ],
        'name': 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountETH',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'address',
            'name': 'tokenA',
            'type': 'address'
          },
          {
            'internalType': 'address',
            'name': 'tokenB',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'liquidity',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountAMin',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountBMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          },
          {
            'internalType': 'bool',
            'name': 'approveMax',
            'type': 'bool'
          },
          {
            'internalType': 'uint8',
            'name': 'v',
            'type': 'uint8'
          },
          {
            'internalType': 'bytes32',
            'name': 'r',
            'type': 'bytes32'
          },
          {
            'internalType': 'bytes32',
            'name': 's',
            'type': 'bytes32'
          }
        ],
        'name': 'removeLiquidityWithPermit',
        'outputs': [
          {
            'internalType': 'uint256',
            'name': 'amountA',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountB',
            'type': 'uint256'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOut',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapETHForExactTokens',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'payable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactETHForTokens',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'payable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactETHForTokensSupportingFeeOnTransferTokens',
        'outputs': [],
        'stateMutability': 'payable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactTokensForETH',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactTokensForETHSupportingFeeOnTransferTokens',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactTokensForTokens',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountIn',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountOutMin',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
        'outputs': [],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOut',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountInMax',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapTokensForExactETH',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'inputs': [
          {
            'internalType': 'uint256',
            'name': 'amountOut',
            'type': 'uint256'
          },
          {
            'internalType': 'uint256',
            'name': 'amountInMax',
            'type': 'uint256'
          },
          {
            'internalType': 'address[]',
            'name': 'path',
            'type': 'address[]'
          },
          {
            'internalType': 'address',
            'name': 'to',
            'type': 'address'
          },
          {
            'internalType': 'uint256',
            'name': 'deadline',
            'type': 'uint256'
          }
        ],
        'name': 'swapTokensForExactTokens',
        'outputs': [
          {
            'internalType': 'uint256[]',
            'name': 'amounts',
            'type': 'uint256[]'
          }
        ],
        'stateMutability': 'nonpayable',
        'type': 'function'
      },
      {
        'stateMutability': 'payable',
        'type': 'receive'
      }
    ]
  }
}
