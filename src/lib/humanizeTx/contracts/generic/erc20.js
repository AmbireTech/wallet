const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher');

module.exports = {
  name: 'ERC20',
  interface: {
    methods: [
      {
        name: 'approve',
        signature: '0x095ea7b3',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text('Approve')
              .alias(txn.from, inputs._spender)
              .text('to spend')
              .tokenAmount(txn.to, inputs._value)
              .action()
          ])
        }
      },
      {
        name: 'transfer',
        signature: '0xa9059cbb',
        summary: ({network, txn, inputs, humanContract}) => {
          //careful when generic contracts are fetched. some argnames are different than some others
          //Should refactor with indexes for more safety...
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text('Transfer')
              .tokenAmount(txn.to, inputs._value)
              .text('to')
              .alias(txn.from, inputs._to)
              .action()
          ])
        }
      }
    ],
    abi: getGenericAbi('ERC20')
  }
}
