const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'MasterchefV2',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0x8dbdbe6d',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('stake')
          return SF.actions([
            SF.text(`Stake ${inputs.amount} tokens in pool #${inputs.pid}`)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text(`Give the benefits to`)
              .alias(txn.from, inputs.to)
              .action(),
          ])
        }
      },
      {
        name: 'withdraw',
        signature: '0x0ad58d2f',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('withdraw')
          return SF.actions([
            SF.text(`Withdraw ${inputs.amount} tokens from pool #${inputs.pid}`)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text(`Give the benefits to`)
              .alias(txn.from, inputs.to)
              .action(),
          ])
        }
      },
      {
        name: 'harvest',
        signature: '0x18fccc76',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('claim')
          return SF.actions([
            SF.text(`Claim rewards of pool #${inputs.pid}`)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text(`Give the benefits to`)
              .alias(txn.from, inputs.to)
              .action(),
          ])
        }
      },
      {
        name: 'withdrawAndHarvest',
        signature: '0xd1abb907',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('withdraw')
          return SF.actions([
            SF.text(`Withdraw ${inputs.amount} tokens from pool #${inputs.pid}`)
              .action(),

            SF.text(`Claim rewards of pool #${inputs.pid}`)
              .action(),

            txn.from.toLowerCase() !== inputs.to.toLowerCase()
            && SF.text(`Give the benefits to`)
              .alias(txn.from, inputs.to)
              .action(),
          ])
        }
      },
    ],
    abi: getGenericAbi('masterchefV2')
  }
}
