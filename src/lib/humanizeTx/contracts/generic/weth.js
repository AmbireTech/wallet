const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  description: 'WETH',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0xd0e30db0',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('wrap')
          return SF.actions([
            SF.text('Wrap')
              .tokenAmount('native', txn.value)
              .action()
          ])
        }
      },
      {
        name: 'withdraw',
        signature: '0x2e1a7d4d',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('unwrap')
          return SF.actions([
            SF.text('Unwrap')
              .tokenAmount('native', inputs.wad)
              .action()
          ])
        }
      },
    ],
    abi: getGenericAbi('WETH')
  }
}
