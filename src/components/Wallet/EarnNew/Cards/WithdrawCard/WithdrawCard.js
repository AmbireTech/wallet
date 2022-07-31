import { useEffect, useRef, useState, useCallback } from 'react'
import Card from 'components/Wallet/EarnNew/Card/Card'
import { Button, Image, AmountInput } from 'components/common'
import BigNumber from 'bignumber.js'
import './WithdrawCard.scss'
import { ethers } from 'ethers'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { Interface } from 'ethers/lib/utils'
import { getProvider } from 'lib/provider'

const WithdrawCard = ({
  selectedNetwork,
  selectedAccount,
  selectedToken,
  selectedStrategy,
  strategies,
  portfolio,
  addRequest,
  inactive
}) => {
  const currentNetwork = useRef()
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [amount, setAmount] = useState({ human: '' })

  useEffect(() => {
    currentNetwork.current = selectedNetwork.id
  }, [selectedNetwork])

  const strategy = (strategies && selectedStrategy && selectedToken) ? (strategies[selectedStrategy].find(s => s.baseTokenSymbol === selectedToken.baseTokenSymbol)) : null

  const replaceValue = (value, valuesMap) => {
    if ((value + '').startsWith('$')) {
      if (value.startsWith('$res')) {
        const splitPath = value.split('.')
        let res = valuesMap.results
        for (let s of splitPath.slice(1)) {
          res = res[s]
        }
        return res
      } else {
        return valuesMap[value.substring(1)]
      }
    }
    return value
  }

  const onWithdrawClick = useCallback(async () => {
    setError(null)
    setLoading(true)

    const reqId = Date.now()
    const provider = getProvider(selectedNetwork.id)

    if (!amount.withDecimals || amount.withDecimals <= 0) {
      setError('Amount required')
      setLoading(false)
      return
    }

    let valuesMap = {
      amount: amount.withDecimals,
      tokenAddress: selectedToken.baseTokenAddress,
      vaultAddress: selectedStrategy.address,
      identityAddress: selectedAccount,
      results: []
    }

    let i = 0
    for (let descriptor of strategy.withdrawTxDescriptor) {

      if (descriptor.requireAllowance) {

        const ercInterface = new ethers.utils.Interface(ERC20ABI)
        const erc20Contract = new ethers.Contract(descriptor.address, ERC20ABI, provider)
        const allowance = await erc20Contract.allowance(selectedAccount, descriptor.spender)

        if (new BigNumber(allowance).lt(amount.withDecimals)) {
          addRequest({
            id: `earn_${reqId}_${i}`,
            type: 'eth_sendTransaction',
            account: selectedAccount,
            chainId: selectedNetwork.chainId,
            txn: {
              to: erc20Contract.address,
              value: '0x0',
              data: ercInterface.encodeFunctionData('approve', [
                descriptor.spender,
                amount.withDecimals
              ])
            }
          })
        }
      } else {
        const ContractInterface = new Interface(descriptor.interface)

        const values = descriptor.args.map(arg => {
          return replaceValue(arg, valuesMap)
        })

        const data = ContractInterface.encodeFunctionData(descriptor.func, values)

        if (descriptor.type === 'write') {
          addRequest({
            id: `earn_${reqId}_${i}`,
            type: 'eth_sendTransaction',
            account: selectedAccount,
            chainId: selectedNetwork.chainId,
            txn: {
              to: descriptor.address,
              value: '0x0',
              data: data
            }
          })
        } else {
          const caller = new ethers.Contract(descriptor.address, ContractInterface)
          valuesMap.results[i] = await caller[descriptor.func](...values)
        }
      }

      i++
    }
    setLoading(false)
  }, [selectedNetwork, amount, selectedToken, selectedStrategy, selectedAccount, strategy, addRequest])

  const stakedTokenDetails = (strategy && portfolio) ? portfolio.tokens.find(t => t.address.toLowerCase() === strategy.address.toLowerCase()) : null

  let availableStakedBalanceBN = stakedTokenDetails ? (new BigNumber(stakedTokenDetails.balanceRaw).div(10 ** stakedTokenDetails.decimals)) : 0


  return (
    <Card
      large={false}
      header={{ step: 3, title: 'Withdraw' }}
      inactive={inactive}
    >

      {
        inactive
          ? (
            <div className='notification-clear'>Select the protocol you wish to unstake from to continue the process</div>
          )
          : (
            <>
              {
                selectedToken &&
                <div className='tokenDetails'>
                  <div className='tokenDetails-icon'>
                    <Image url={selectedToken.icon} alt={selectedToken.name}/>
                  </div>
                  <div className='tokenDetails-text'>
                    {selectedToken.baseTokenSymbol}
                  </div>
                </div>
              }

              {
                selectedToken && strategy &&
                <table className='depositDetails'>
                  <tr>
                    <td>Staked balance</td>
                    <td>
              <span
                className={'amount-suggestion'}
                onClick={() => {
                  setAmount({
                    human: availableStakedBalanceBN.toFixed(),
                    withDecimals: availableStakedBalanceBN.multipliedBy(10 ** selectedToken.decimals).toFixed(0)
                  })
                }}>
                  {availableStakedBalanceBN.toFixed(8)} {strategy.symbol}
              </span>
                    </td>
                  </tr>
                </table>
              }

              {
                error && <div className='error-message'>
                  {error}
                </div>
              }

              <AmountInput
                decimals={selectedToken.decimals}
                placeholder={`${selectedToken.symbol} Amount`}
                value={amount.human}
                onChange={(val) => setAmount(val)}
              />

              <Button
                className='earnButton'
                disabled={!selectedToken || !selectedStrategy || isLoading}
                onClick={onWithdrawClick}
              >Withdraw</Button>
            </>
          )
      }
    </Card>
  )
}

export default WithdrawCard
