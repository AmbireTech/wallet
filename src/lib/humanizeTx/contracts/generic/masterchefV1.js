const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'MasterchefV1',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0xe2bbb158',
        summary: ({network, txn, inputs, humanContract}) => {
          if (inputs._amount.toString() > 0) {
            const SF = new SummaryFormatter(network, humanContract.manager).mainAction('stake')
            return SF.actions([
              SF.text(`Stake ${inputs._amount} tokens in pool #${inputs._pid}`)
                .action()
            ])
          } else {
            const SF = new SummaryFormatter(network, humanContract.manager).mainAction('claim')
            return SF.actions([
              SF.text(`Claim rewards of pool #${inputs._pid}`)
                .action()
            ])
          }
        }
      },
      {
        name: 'withdraw',
        signature: '0x441a3e70',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('withdraw')
          return SF.actions([
            SF.text(`Withdraw ${inputs._amount} tokens of pool #${inputs._pid}`)
              .action()
          ])
        }
      },
    ],
    abi: getGenericAbi('masterchefV1')
  }
}
