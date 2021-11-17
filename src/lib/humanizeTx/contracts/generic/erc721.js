const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')

module.exports = {
  name: 'ERC721',
  interface: {
    methods: [
      {
        name: 'approve',
        signature: '0x095ea7b3',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text(`Approve Token #${inputs.tokenId} to be transfered by`)
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      /*{
          name: 'setApprovalForAll',
          summary: ({network, txn, inputs, humanContract}) => {
              let action
              if (inputs.approved) {
                  action = `Approve ${contract.alias( txn.from, inputs.to)} to be transfer all the tokens ${contract.alias( txn.from, inputs.to)}`
              } else {
                  action = `Deny ${contract.alias( txn.from, inputs.to)} to be transfer all the tokens ${contract.alias( txn.from, inputs.to)}`
              }
              return [
                  action
              ]
          }
      },*/
      {
        name: 'transferFrom',
        signature: '0x23b872dd',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs.tokenId} from`)
              .alias(txn.from, inputs.from)
              .text('to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {
        name: 'safeTransferFrom',//how many cases exist with same methodName and different signature?
        signature: '0x42842e0e',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs.tokenId} from`)
              .alias(txn.from, inputs.from)
              .text('to')
              .alias(txn.from, inputs.to)
              .action()
          ])
        }
      },
      {//NOT AN ERC721 STANDARD???
        name: 'transfer',
        signature: '0xa9059cbb',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager)
          return SF.actions([
            SF.text(`Transfer Token #${inputs._tokenId} to`)
              .alias(txn.from, inputs._to)
              .action()
          ])
        }
      }
    ],
    abi: getGenericAbi('erc721')
  },
}
