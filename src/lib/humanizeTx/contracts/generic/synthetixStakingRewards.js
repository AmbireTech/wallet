const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'synthetixStakingRewards',
  interface: {
    methods: [
      {
        name: 'getReward',
        signature: '0x3d18b912',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('claim')
          return SF.actions([
            SF.text(`Claim rewards`)
              .action(),
          ])
        }
      },
      {
        name: 'exit',
        signature: '0xe9fad8ee',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('exit')
          return SF.actions([
            SF.text(`Exit`)
              .action(),
          ])
        }
      },
      {
        name: 'withdraw',
        signature: '0x2e1a7d4d',
        summary: ({network, txn, inputs, humanContract}) => {
          const lpTokenAddress = (humanContract.data.lpToken && humanContract.data.lpToken.address) ? humanContract.data.lpToken.address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('exit')
          return SF.actions([
            SF.text(`Withdraw`)
              .tokenAmount(lpTokenAddress, inputs.amount, 8)
              .action(),
          ])
        }
      },
      {
        name: 'stake',
        signature: '0xa694fc3a',
        summary: ({network, txn, inputs, humanContract}) => {
          const lpTokenAddress = (humanContract.data.lpToken && humanContract.data.lpToken.address) ? humanContract.data.lpToken.address : ''
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('stake')
          return SF.actions([
            SF.text(`Stake`)
              .tokenAmount(lpTokenAddress, inputs.amount, 8)
              .action(),
          ])
        }
      },
    ],
    abi: getGenericAbi('synthetixStakingRewards')
  }
}
