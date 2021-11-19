const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  description: 'cTokens',
  interface: {
    methods: [
      {
        name: 'mint',
        signature: '0xa0712d68',
        summary: ({network, txn, inputs, humanContract}) => {
          const underlyingAddress = humanContract.data.underlying ? humanContract.data.underlying.address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('supply')
          return SF.actions([
            SF.text('Supply')
              .tokenAmount(underlyingAddress, inputs.mintAmount)
              .action(),
          ])
        }
      },
      {
        name: 'redeem',
        signature: '0xdb006a75',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('withdraw')
          return SF.actions([
            SF.text('Withdraw')
              .tokenAmount(humanContract.address, inputs.redeemTokens)
              .action()
          ])
        }
      },
      {
        name: 'repayBorrow',
        signature: '0x0e752702',
        summary: ({network, txn, inputs, humanContract}) => {
          const underlyingAddress = humanContract.data.underlying ? humanContract.data.underlying.address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('repay_borrow')
          return SF.actions([
            SF.text('Repay borrow with')
              .tokenAmount(underlyingAddress, inputs.repayAmount, null, null, (data) => {
                if (data.infinity) return 'the maximum possible'
                return data.amount
              })
              .text('tokens')
              .action()
          ])
        }
      },
    ],
    abi: getGenericAbi('cToken')
  }
}
