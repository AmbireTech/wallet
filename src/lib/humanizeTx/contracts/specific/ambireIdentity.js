const SummaryFormatter = require('../../summaryFormatter')
const { getSpecificAbiByName } = require('../../../abiFetcher')
const BigNumber = require('bignumber.js')

module.exports = {
  description: 'AmbireIdentity',
  interface: {
    methods: [
      {
        name: 'setAddrPrivilege',
        signature: '0x0d5828d4',
        summary: ({network, txn, inputs, humanContract}) => {
          const grant = new BigNumber(inputs.priv).eq(1)
          const revoke = new BigNumber(inputs.priv).eq(0)
          const passphrase = !(grant || revoke)
          if (grant) {
            const SF = new SummaryFormatter(network, humanContract.manager).mainAction('authenticate')
            return SF.actions([
              SF.text('Authenticate signer')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          } else if (revoke) {
            const SF = new SummaryFormatter(network, humanContract.manager).mainAction('revoke')
            return SF.actions([
              SF.text('Revoke signer')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          } else {
            const SF = new SummaryFormatter(network, humanContract.manager).mainAction('ambire_update_passphrase')
            return SF.actions([
              SF.text('Add email/passphrase to')
                .alias(txn.from, inputs.addr)
                .action(),
            ])
          }
        }
      },
    ],
    abi: getSpecificAbiByName('AmbireIdentity', 'polygon')
  }
}
