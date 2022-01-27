import './FeeSelector.scss'

import { AiOutlineWarning } from 'react-icons/ai'
import { Loading, Select, ToolTip } from 'components/common'
import { isTokenEligible, getFeePaymentConsequences, mapTxnErrMsg, getErrHint } from './helpers'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']

const zapperStorageTokenIcons = 'https://storage.googleapis.com/zapper-fi-assets/tokens'

export function FeeSelector ({ disabled, signer, estimation, network, setEstimation, feeSpeed, setFeeSpeed }) {
    if (!estimation) return (<Loading/>)
    // Only check for insufficient fee in relayer mode (.feeInUSD is available)
    // Otherwise we don't care whether the user has enough for fees, their signer wallet will take care of it
    const insufficientFee = estimation && estimation.feeInUSD
      && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation)
    if (estimation && !estimation.success) return (<FailingTxn
      message={<>The current transaction batch cannot be sent because it will fail: {mapTxnErrMsg(estimation.message)}</>}
      tooltip={getErrHint(estimation.message)}
    />)
  
    if (!estimation.feeInNative) return (<></>)
    if (estimation && !estimation.feeInUSD && estimation.gasLimit < 40000) {
      return (<div>
        <b>WARNING:</b> Fee estimation unavailable when you're doing your first account transaction and you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>, make sure you have {network.nativeAssetSymbol} there.
      </div>)
    }
    if (estimation && estimation.feeInUSD && !estimation.remainingFeeTokenBalances) {
      return (<div className='balance-error'>Internal error: fee balances not available. This should never happen, please report this on help.ambire.com</div>)
    }
  
    const { nativeAssetSymbol } = network
    const tokens = estimation.remainingFeeTokenBalances || [{ symbol: nativeAssetSymbol, decimals: 18 }]
    const onFeeCurrencyChange = value => {
      const token = tokens.find(({ address, symbol }) => address === value || symbol === value)
      setEstimation({ ...estimation, selectedFeeToken: token })
    }

    const currenciesItems = tokens
      .filter(token => isTokenEligible(token, feeSpeed, estimation))
      .map(({ address, symbol }) => ({
        icon: address ? `${zapperStorageTokenIcons}/${network.id}/${address.toLowerCase()}.png` : null,
        label: symbol,
        value: address || symbol
      }))

    const feeCurrencySelect = estimation.feeInUSD ? (<>
      <div className='section'>
        <div className='section-title'>Fee Currency</div>
        <Select
          disabled={disabled}
          defaultValue={estimation.selectedFeeToken?.address || estimation.selectedFeeToken?.symbol}
          items={currenciesItems}
          onChange={onFeeCurrencyChange}
        />
      </div>
    </>) : (<></>)
  
    const areSelectorsDisabled = disabled || insufficientFee
    const { isStable } = estimation.selectedFeeToken
    const { multiplier } = getFeePaymentConsequences(estimation.selectedFeeToken, estimation)
    const feeAmountSelectors = SPEEDS.map(speed => (
      <div 
        key={speed}
        className={`feeSquare${feeSpeed === speed ? ' selected' : ''}${areSelectorsDisabled ? ' disabled' : ''}`}
        onClick={() => !areSelectorsDisabled && setFeeSpeed(speed)}
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
      {insufficientFee ?
        (<div className='balance-error'>Insufficient balance for the fee.<br/>Accepted tokens: {(estimation.remainingFeeTokenBalances || []).map(x => x.symbol).join(', ')}</div>)
        : feeCurrencySelect
      }
      <div className='section'>
        <div className='section-title'>Transaction Speed</div>
        <div id='fee-selector'>{feeAmountSelectors}</div>
      </div>
      { // Visualize the fee once again with a USD estimation if in native currency
      !isStable && (<div className='native-fee-estimation'>
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
      <ToolTip label={tooltip}>
        <div className='error-title'><AiOutlineWarning></AiOutlineWarning> Warning</div>
        <div className='error-message'>{message}</div>
      </ToolTip>
    </div>)
}