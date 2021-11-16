const SummaryFormatter = require('../../summaryFormatter');

module.exports = {
    name: "ERC20",
    interface: {
        methods:[
            {
                name: 'approve',
                signature: '0x095ea7b3',
                summary: ({network, txn, inputs, contract}) => {
                    const SF = new SummaryFormatter(network, contract.manager)
                    return SF.actions([
                        SF.text('Approve')
                          .alias( txn.from, inputs._spender)
                          .text('to spend')
                          .tokenAmount( txn.to, inputs._value)
                          .action()
                    ])
                }
            },
            {
                name: 'transfer',
                signature: '0xa9059cbb',
                summary: ({network, txn, inputs, contract}) => {
                    const SF = new SummaryFormatter(network, contract.manager)
                    return SF.actions([
                        SF.text('Transfer')
                          .tokenAmount( txn.to, inputs._value)
                          .text('to')
                          .alias( txn.from, inputs._to)
                          .action()
                    ])
                }
            }
        ],
        abi: [{"name":"Transfer","inputs":[{"name":"_from","type":"address","indexed":true},{"name":"_to","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"name":"Approval","inputs":[{"name":"_owner","type":"address","indexed":true},{"name":"_spender","type":"address","indexed":true},{"name":"_value","type":"uint256","indexed":false}],"anonymous":false,"type":"event"},{"stateMutability":"nonpayable","type":"constructor","inputs":[{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_total_supply","type":"uint256"}],"outputs":[]},{"stateMutability":"view","type":"function","name":"decimals","inputs":[],"outputs":[{"name":"","type":"uint256"}],"gas":288},{"stateMutability":"nonpayable","type":"function","name":"transfer","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":74740},{"stateMutability":"nonpayable","type":"function","name":"transferFrom","inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":111382},{"stateMutability":"nonpayable","type":"function","name":"approve","inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":37821},{"stateMutability":"nonpayable","type":"function","name":"increaseAllowance","inputs":[{"name":"_spender","type":"address"},{"name":"_added_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":39065},{"stateMutability":"nonpayable","type":"function","name":"decreaseAllowance","inputs":[{"name":"_spender","type":"address"},{"name":"_subtracted_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":39089},{"stateMutability":"nonpayable","type":"function","name":"mint","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":75679},{"stateMutability":"nonpayable","type":"function","name":"burnFrom","inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"gas":75697},{"stateMutability":"nonpayable","type":"function","name":"set_minter","inputs":[{"name":"_minter","type":"address"}],"outputs":[],"gas":36485},{"stateMutability":"view","type":"function","name":"name","inputs":[],"outputs":[{"name":"","type":"string"}],"gas":7760},{"stateMutability":"view","type":"function","name":"symbol","inputs":[],"outputs":[{"name":"","type":"string"}],"gas":6813},{"stateMutability":"view","type":"function","name":"balanceOf","inputs":[{"name":"arg0","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"gas":1633},{"stateMutability":"view","type":"function","name":"allowance","inputs":[{"name":"arg0","type":"address"},{"name":"arg1","type":"address"}],"outputs":[{"name":"","type":"uint256"}],"gas":1878},{"stateMutability":"view","type":"function","name":"totalSupply","inputs":[],"outputs":[{"name":"","type":"uint256"}],"gas":1478},{"stateMutability":"view","type":"function","name":"minter","inputs":[],"outputs":[{"name":"","type":"address"}],"gas":1508}]
    },
}
