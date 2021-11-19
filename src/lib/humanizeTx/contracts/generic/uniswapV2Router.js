const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('addLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('addLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('removeLiquidity')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
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
    abi: getGenericAbi('UniswapV2Router')
  }
}
