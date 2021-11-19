const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'curveGauge',
  interface: {
    methods: [
      {
        name: 'deposit',
        signature: '0xb6b55f25',
        summary: ({network, txn, inputs, humanContract}) => {
          const lpAddress = (humanContract.data.lpToken && humanContract.data.lpToken.address) ? humanContract.data.lpToken.address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('deposit')
          return SF.actions([
            SF.text('Deposit')
              .tokenAmount(lpAddress, inputs._value)
              .text('to curve gauge')
              .action()
          ])
        }
      },
      {
        name: 'withdraw',
        signature: '0x2e1a7d4d',
        summary: ({network, txn, inputs, humanContract}) => {
          const lpAddress = (humanContract.data.lpToken && humanContract.data.lpToken.address) ? humanContract.data.lpToken.address : ''

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('withdraw')
          return SF.actions([
            SF.text('Withdraw')
              .tokenAmount(lpAddress, inputs._value)
              .text('to curve gauge')
              .action()
          ])
        }
      },
    ],
    abi: getGenericAbi('curveGauge')
  }
}
