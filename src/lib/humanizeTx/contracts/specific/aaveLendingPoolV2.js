const SummaryFormatter = require('../../summaryFormatter')
const { getSpecificAbiByName } = require('../../../abiFetcher')

module.exports = {
  description: 'AaveLendingPoolV2',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0xe8eda9df',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('deposit')
          return SF.actions([
            SF.text('Deposit')
              .tokenAmount(inputs.asset, inputs.amount)
              .text('as collateral')
              .action(),

            txn.from.toLowerCase() !== inputs.onBehalfOf.toLowerCase()
            && SF.text('On behalf of')
              .alias(txn.from, inputs.onBehalfOf)
          ])
        }
      },
      {
        name: 'borrow',
        signature: '0xa415bcad',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('borrow')
          return SF.actions([
            SF.text('Borrow')
              .tokenAmount(inputs.asset, inputs.amount)
              .text('as collateral')
              .action(),

            txn.from.toLowerCase() !== inputs.onBehalfOf.toLowerCase()
            && SF.text('On behalf of')
              .alias(txn.from, inputs.onBehalfOf)
          ])
        }
      },
      {
        name: 'repay',
        signature: '0x573ade81',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('repay')
          return SF.actions([
            SF.text('Borrow')
              .tokenAmount(inputs.asset, inputs.amount, null, null, (data) => (data.infinity ? 'maximum' : data.amount))
              .action(),

            txn.from.toLowerCase() !== inputs.onBehalfOf.toLowerCase()
            && SF.text('On behalf of')
              .alias(txn.from, inputs.onBehalfOf)
          ])
        }
      },
    ],
    abi: getSpecificAbiByName('AAVELendingPool2', 'ethereum')
  }
}
