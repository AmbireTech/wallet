const SummaryFormatter = require('../../summaryFormatter')
const { getSpecificAbiByName } = require('../../../abiFetcher')

module.exports = {
  description: 'AaveLendingPoolV1',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0xd2d0e066',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('deposit')
          return SF.actions([
            SF.text('Deposit')
              .tokenAmount(inputs._reserve, inputs._amount)
              .text('as collteral')
              .action()
          ])
        }
      },
      {
        name: 'borrow',
        signature: '0xc858f5f9',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('borrow')
          return SF.actions([
            SF.text('Borrow')
              .tokenAmount(inputs._reserve, inputs._amount)
              .action()
          ])
        }
      },
      {
        name: 'repay',
        signature: '0x5ceae9c4',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('repay')
          return SF.actions([
            SF.text('Repay')
              .tokenAmount(inputs._reserve, inputs._amount, null, null, (data) => (data.infinity ? 'maximum' : data.amount))
              .action(),

            txn.from.toLowerCase() !== inputs._onBehalfOf.toLowerCase()
            && SF.text('On behalf of')
              .alias(txn.from, inputs._onBehalfOf)
          ])
        }
      },
      {
        name: 'redeemUnderlying',
        signature: '0x9895e3d8',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('redeem')
          return SF.actions([
            SF.text('Repay')
              .tokenAmount(inputs._reserve, inputs._amount, null, null, (data) => (data.infinity ? 'maximum' : data.amount))
              .action(),

            txn.from.toLowerCase() !== inputs._user.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs._user)
          ])
        }
      },
    ],
    abi: getSpecificAbiByName('AAVELendingPool1', 'ethereum')
  }
}
