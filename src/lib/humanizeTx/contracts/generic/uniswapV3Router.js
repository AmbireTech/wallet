const SummaryFormatter = require('../../summaryFormatter')
const { getGenericAbi } = require('../../../abiFetcher')
const {ethers} = require('ethers')
const ABI = getGenericAbi('UniswapV3Router')

module.exports = {
  name: 'UniswapV3Router',
  interface: {
    methods: [
      {
        name: 'multicall',
        signature: '0xac9650d8',
        summary: ({network, txn, inputs, humanContract}) => {

          const iface = new ethers.utils.Interface(ABI)
          const calldataArray = iface.decodeFunctionData(txn.data.slice(0, 10), txn.data)

          const summaries = []
          for (const calldata of calldataArray.data) {
            const subTx = {
              ...txn,
              data: calldata
            }
            const subSummary = humanContract.manager.getSummary(network, subTx)

            summaries.push(...subSummary.summaries.actions)
          }

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('multicall')
          return SF.actions(summaries)
        }
      },
      {
        name: 'selfPermit',
        signature: '0xf3995c67',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('self_permit')
          return SF.actions([
            SF.text('Self Permit')
              .action()
          ])
        }
      },
      {
        name: 'exactInputSingle',
        signature: '0x414bf389',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(inputs.params.tokenIn, inputs.params.amountIn.toString())
              .text('for at least')
              .tokenAmount(inputs.params.tokenOut, inputs.params.amountOutMinimum.toString())
              .action(),

            txn.from.toLowerCase() !== inputs.params.recipient.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.params.recipient)
              .action()
          ])
        }
      },
      {
        name: 'exactInput',
        signature: '0xc04b8d59',
        summary: ({network, txn, inputs, humanContract}) => {
          //some decodePacked fun
          const path = []
          for (let i = 2; i < inputs.params.path.length; i += 46) {//address, uint24
            path.push('0x' + inputs.params.path.substr(i, 40))
          }

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap')
              .tokenAmount(path[0], inputs.params.amountIn.toString())
              .text('for at least')
              .tokenAmount(path[path.length - 1], inputs.params.amountOutMinimum.toString())
              .action(),

            txn.from.toLowerCase() !== inputs.params.recipient.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.params.recipient)
              .action()
          ])
        }
      },
      {
        name: 'exactOutputSingle',
        signature: '0xdb3e2198',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap a maximum of')
              .tokenAmount(inputs.params.tokenIn, inputs.params.amountInMaximum.toString())
              .text('for')
              .tokenAmount(inputs.params.tokenOut, inputs.params.amountOut.toString())
              .action(),

            txn.from.toLowerCase() !== inputs.params.recipient.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.params.recipient)
              .action()
          ])
        }
      },
      //to be tested
      {
        name: 'exactOutput',
        signature: '0xf28c0498',
        summary: ({network, txn, inputs, humanContract}) => {
          //some decodePacked fun
          const path = []
          for (let i = 2; i < inputs.params.path.length; i += 46) {//address, uint24
            path.push('0x' + inputs.params.path.substr(i, 40))
          }

          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('swap')
          return SF.actions([
            SF.text('Swap a maximum of')
              .tokenAmount(path[0], inputs.params.amountInMaximum.toString())
              .text('for')
              .tokenAmount(path[path.length - 1], inputs.params.amountOut.toString())
              .action(),

            txn.from.toLowerCase() !== inputs.params.recipient.toLowerCase()
            && SF.text('Send it to')
              .alias(txn.from, inputs.params.recipient)
              .action()
          ])
        }
      },
      {
        name: 'unwrapWETH9',
        signature: '0x49404b7c',
        summary: ({network, txn, inputs, humanContract}) => {
          const SF = new SummaryFormatter(network, humanContract.manager).mainAction('unwrap')
          return SF.actions([
            SF.text('Unwrap')
              .tokenAmount('native', inputs.amountMinimum.toString())
              .text('WETH')
              .action(),
          ])
        }
      },
    ],
    abi: ABI
  }
}
