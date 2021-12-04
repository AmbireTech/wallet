import { AiOutlineWarning } from 'react-icons/ai'
import { FiHelpCircle } from 'react-icons/fi'
import { Loading } from '../common'
import { isTokenEligible, getFeePaymentConsequences, mapTxnErrMsg, getErrHint } from './helpers'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']

export function FeeSelector ({ disabled, signer, estimation, network, setEstimation, feeSpeed, setFeeSpeed }) {
    if (!estimation) return (<Loading/>)
  
    const insufficientFee = estimation && estimation.feeInUSD
      && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation)
    if (estimation && !estimation.success) return (<FailingTxn
      message={<>The current transaction batch cannot be sent because it will fail: {mapTxnErrMsg(estimation.message)}</>}
      tooltip={getErrHint(estimation.message)}
    />)
    if (insufficientFee) return (
      <h3 className='error'>Insufficient balance for the fee. Accepted tokens: {(estimation.remainingFeeTokenBalances || []).map(x => x.symbol).join(', ')}</h3>
    )
  
    if (!estimation.feeInNative) return (<></>)
    if (estimation && !estimation.feeInUSD && estimation.gasLimit < 40000) {
      return (<div>
        <b>WARNING:</b> Fee estimation unavailable when you're doing your first account transaction and you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>, make sure you have {network.nativeAssetSymbol} there.
      </div>)
    }
  
    const { nativeAssetSymbol } = network
    const tokens = estimation.remainingFeeTokenBalances || ({ symbol: nativeAssetSymbol, decimals: 18 })
    const onFeeCurrencyChange = e => {
      const token = tokens.find(({ symbol }) => symbol === e.target.value)
      setEstimation({ ...estimation, selectedFeeToken: token })
    }
    const feeCurrencySelect = estimation.feeInUSD ? (<>
      <span style={{ marginTop: '1em' }}>Fee currency</span>
      <select disabled={disabled} value={estimation.selectedFeeToken.symbol} onChange={onFeeCurrencyChange}>
        {tokens.map(token => 
          (<option
            disabled={!isTokenEligible(token, feeSpeed, estimation)}
            key={token.symbol}>
              {token.symbol}
            </option>
          )
        )}
      </select>
    </>) : (<></>)
  
    const { isStable } = estimation.selectedFeeToken
    const { multiplier } = getFeePaymentConsequences(estimation.selectedFeeToken, estimation)
    const feeAmountSelectors = SPEEDS.map(speed => (
      <div 
        key={speed}
        className={`feeSquare${feeSpeed === speed ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => !disabled && setFeeSpeed(speed)}
      >
        <div className='speed'>{speed}</div>
        <div className='feeEstimation'>
          {isStable
            ? '$'+(estimation.feeInUSD[speed] * multiplier)
            : (
              nativeAssetSymbol === 'ETH' ?
                'Ξ '+(estimation.feeInNative[speed] * multiplier)
                : (estimation.feeInNative[speed] * multiplier)+' '+nativeAssetSymbol
            )
          }
        </div>
      </div>
    ))
  
    return (<>
      {feeCurrencySelect}
      <div className='feeAmountSelectors'>
        {feeAmountSelectors}
      </div>
      { // Visualize the fee once again with a USD estimation if in native currency
      !isStable && (<div>
        Fee: {(estimation.feeInNative[feeSpeed] * multiplier)+' '+nativeAssetSymbol}
        &nbsp;(~ ${(estimation.feeInNative[feeSpeed] * multiplier * estimation.nativeAssetPriceInUSD).toFixed(2)})
      </div>)}
      {!estimation.feeInUSD ?
        (<span><b>WARNING:</b> Paying fees in tokens other than {nativeAssetSymbol} is unavailable because you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>.</span>)
        : (<></>)}
    </>)
}

export function FailingTxn ({ message, tooltip = '' }) {
    return (<div className='failingTxn'>
        <AiOutlineWarning></AiOutlineWarning>
        <h3 className='error'>{message}</h3>
        <FiHelpCircle title={tooltip}></FiHelpCircle>
    </div>)
}