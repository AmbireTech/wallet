const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'curveSwap',
  interface: {
    methods: [
      {
        name: 'exchange_underlying',
        signature: '0xa6417ed6',
        summary: ({network, txn, inputs, humanContract}) => {
          //index out of bounds check
          const inAddress = (humanContract.data.underlying && humanContract.data.underlying[inputs.i] && humanContract.data.underlying[inputs.i].address) ? humanContract.data.underlying[inputs.i].address : ''
          const outAddress = (humanContract.data.underlying && humanContract.data.underlying[inputs.j] && humanContract.data.underlying[inputs.j].address) ? humanContract.data.underlying[inputs.j].address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inAddress, inputs.dx)
              .text('for at least')
              .tokenAmount(outAddress, inputs.min_dy)
              .action()
          ])
        }
      },
      {
        name: 'remove_liquidity_imbalance',
        signature: '0x9fdaea0c',
        summary: ({network, txn, inputs, humanContract}) => {
          const liquidityAddresses = {
            0: (humanContract.data.underlying && humanContract.data.underlying[0] && humanContract.data.underlying[0].address) ? humanContract.data.underlying[0].address : '',
            1: (humanContract.data.underlying && humanContract.data.underlying[1] && humanContract.data.underlying[1].address) ? humanContract.data.underlying[1].address : '',
            2: (humanContract.data.underlying && humanContract.data.underlying[2] && humanContract.data.underlying[2].address) ? humanContract.data.underlying[2].address : ''
          }

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('remove_liquidity')
          return SF.actions([
            SF.text('Remove liquidity for').action(),
            inputs.amounts[0] > 0 && SF.tokenAmount(liquidityAddresses[0], inputs.amounts[0]).action(),
            inputs.amounts[1] > 0 && SF.tokenAmount(liquidityAddresses[1], inputs.amounts[1]).action(),
            inputs.amounts[2] > 0 && SF.tokenAmount(liquidityAddresses[2], inputs.amounts[2]).action()
          ])
        }
      },
      {
        name: 'add_liquidity',
        signature: '0x4515cef3',
        summary: ({network, txn, inputs, humanContract}) => {
          const liquidityAddresses = {
            0: (humanContract.data.underlying && humanContract.data.underlying[0] && humanContract.data.underlying[0].address) ? humanContract.data.underlying[0].address : '',
            1: (humanContract.data.underlying && humanContract.data.underlying[1] && humanContract.data.underlying[1].address) ? humanContract.data.underlying[1].address : '',
            2: (humanContract.data.underlying && humanContract.data.underlying[2] && humanContract.data.underlying[2].address) ? humanContract.data.underlying[2].address : ''
          }

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('add_liquidity')
          return SF.actions([
            SF.text('Add liquidity for at least')
              .tokenAmount(humanContract.data.lpToken.address, inputs.min_mint_amount)
              .action(),
            inputs.amounts[0] > 0 && SF.tokenAmount(liquidityAddresses[0], inputs.amounts[0]).action(),
            inputs.amounts[1] > 0 && SF.tokenAmount(liquidityAddresses[1], inputs.amounts[1]).action(),
            inputs.amounts[2] > 0 && SF.tokenAmount(liquidityAddresses[2], inputs.amounts[2]).action()
          ])
        }
      },
    ],
    abi: getGenericAbi('curveSwap')
  }
}
