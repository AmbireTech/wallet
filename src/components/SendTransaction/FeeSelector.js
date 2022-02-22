import './FeeSelector.scss'

import { AiOutlineWarning } from 'react-icons/ai'
import { Loading, Select, ToolTip, Button, TextInput } from 'components/common'
import {
  isTokenEligible,
  mapTxnErrMsg,
  getErrHint,
  getFeesData,
  getDiscountApplied,
} from './helpers'
import { FaPercentage } from 'react-icons/fa'
import { MdInfoOutline } from 'react-icons/md'
import { NavLink } from 'react-router-dom'
import { MdEdit } from 'react-icons/md'
import { useState } from 'react'
import { getTokenIcon } from 'lib/icons'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const walletDiscountBlogpost = 'https://medium.com/@marialuiza.cluve/start-moving-crypto-with-ambire-pay-gas-with-wallet-and-jump-on-the-exclusive-promo-7c605a181294'

const WalletDiscountBanner = ({ currenciesItems, tokens, estimation, onFeeCurrencyChange, onDismiss }) => {
  const walletDiscountToken = tokens.find(x => x.symbol === 'WALLET' && x.discount)

  if (!walletDiscountToken) return null

  const alreadySelected =
    estimation.selectedFeeToken?.address === walletDiscountToken.address
    || estimation.selectedFeeToken?.symbol === walletDiscountToken.symbol

  if (!!alreadySelected) return null

  const { discount } = walletDiscountToken
  const eligibleWalletToken = currenciesItems.find(x => x.value && (x.value === 'WALLET' || x.value === walletDiscountToken.address))
  const action = !!eligibleWalletToken
    ? () => onFeeCurrencyChange(eligibleWalletToken.value)
    : null
  //TODO: go to swap 
  const actionTxt = !!eligibleWalletToken ? 'USE $WALLET' : 'BUY WALLET'
  const showSwap = !action

  return (
    <div className='wallet-discount-banner row'>
      <div className='row'>
        Get {discount * 100} <FaPercentage /> fees discount with &nbsp;<strong>$WALLET</strong> &nbsp;
        <a
          className="address row"
          href={walletDiscountBlogpost}
          target="_blank"
          rel="noreferrer noopener">
          <MdInfoOutline />
        </a>
      </div>
      {!!action && <Button onClick={action} mini>
        {actionTxt}
      </Button>}
      {showSwap && <div className='swap-info'>
        You can get $WALLET, just use the &nbsp;
        <NavLink className='link' to={'/wallet/swap'} onClick={onDismiss}>
          Swap
        </NavLink> menu on the left!
      </div>}
    </div>
  )
}

export function FeeSelector({ disabled, signer, estimation, network, setEstimation, feeSpeed, setFeeSpeed, onDismiss }) {
  const [editCustomFee, setEditCustomFee] = useState(false)

  if (!estimation) return (<Loading />)
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
    .sort((a, b) => (b.discount || 0) - (a.discount || 0))
    .map(({ address, symbol, discount }) => ({
      icon: address ? getTokenIcon(network.id, address) : null,
      label: symbol,
      value: address || symbol,
      ...(discount ? {
        extra: <div className='discount'> - {discount * 100} <FaPercentage /> </div>
      } : {})
    }))

  const feeCurrencySelect = estimation.feeInUSD ? (<>
    <div className='section'>
      <div className='section-title'>Fee Currency</div>
      <Select
        className="fee-select"
        disabled={disabled}
        defaultValue={estimation.selectedFeeToken?.address || estimation.selectedFeeToken?.symbol}
        items={currenciesItems}
        onChange={onFeeCurrencyChange}
      />
    </div>
  </>) : (<></>)

  const { discount = 0, symbol } = estimation.selectedFeeToken

  const setCustomFee = value => setEstimation(prevEstimation => ({
    ...prevEstimation,
    customFee: value
  }))

  const selectFeeSpeed = speed => {
    setFeeSpeed(speed)
    setCustomFee(null)
    setEditCustomFee(false)
  }

  if (insufficientFee) {
    const sufficientSpeeds = SPEEDS.filter((speed, i ) =>  isTokenEligible(estimation.selectedFeeToken, speed, estimation))
    const highestSufficientSpeed = sufficientSpeeds[sufficientSpeeds.length - 1] 
    setFeeSpeed(highestSufficientSpeed)
  }

  const checkIsSelectorDisabled = speed => {
    const insufficientFee = estimation && estimation.feeInUSD
    && !isTokenEligible(estimation.selectedFeeToken, speed, estimation)
    
    return disabled || insufficientFee
  } 


  const feeAmountSelectors = SPEEDS.map(speed => {
    const isETH = symbol === 'ETH' && nativeAssetSymbol === 'ETH'
    const {
      feeInFeeToken,
      // NOTE: get the estimation res data w/o custom fee for the speeds
    } = getFeesData({ ...estimation.selectedFeeToken }, { ...estimation, customFee: null }, speed)
    const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)

    return (
      <div
        key={speed}
        className={`feeSquare${!estimation.customFee && feeSpeed === speed ? ' selected' : ''}${checkIsSelectorDisabled(speed) ? ' disabled' : ''}`}
        onClick={() => !checkIsSelectorDisabled(speed) && selectFeeSpeed(speed)}
      >
        {!!discount && <FaPercentage className='discount-badge' />}
        <div className='speed'>{speed}</div>
        <div className='feeEstimation'>
          {(isETH ? 'Ξ ' : '')
            + (feeInFeeToken + discountInFeeToken)
            + (!isETH ? ` ${estimation.selectedFeeToken.symbol}` : '')
          }
        </div>
        {!isETH && <div className='feeEstimation symbol'>
          {estimation.selectedFeeToken.symbol}
        </div>}
      </div>
    )
  })

  const {
    feeInFeeToken,
    feeInUSD,
  } = getFeesData(estimation.selectedFeeToken, estimation, feeSpeed)

  const {
    feeInFeeToken: minFee,
    feeInUSD: minFeeUSD,
  } = getFeesData({ ...estimation.selectedFeeToken }, { ...estimation, customFee: null }, 'slow')
  const discountMin = getDiscountApplied(minFee, discount)

  const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
  const discountInUSD = getDiscountApplied(feeInUSD, discount)
  const discountBaseMinInUSD = getDiscountApplied(feeInUSD, discount)

  // Fees with no discounts applied
  const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
  const baseFeeInUSD = feeInUSD + discountInUSD
  const baseMinFee = minFee + discountMin
  const baseMinFeeUSD = minFeeUSD + discountBaseMinInUSD

  const isUnderpriced = !!estimation.customFee
    && !isNaN(parseFloat(estimation.customFee))
    && (baseFeeInFeeToken < baseMinFee)

  return (<>
    {insufficientFee ?
      (<div className='balance-error'>Insufficient balance for the fee.<br />Accepted tokens: {(estimation.remainingFeeTokenBalances || []).map(x => x.symbol).join(', ')}</div>)
      : feeCurrencySelect
    }

    {WalletDiscountBanner({
      currenciesItems,
      tokens,
      estimation,
      onFeeCurrencyChange,
      onDismiss
    })}

    <div className='section-title'>Transaction Speed</div>
    <div className='fee-selector'>
      <div className='section'>
        <div id='fee-selector'>{feeAmountSelectors}</div>
        {
          !editCustomFee ?
            <div id='edit-custom-fee' onClick={() => setEditCustomFee(true)}>
              <MdEdit />Edit fee
            </div>
            :
            <div id='custom-fee-selector'>
              <div className='title'>Custom Fee ({symbol})</div>
              <TextInput
                small
                placeholder='Enter amount'
                className={`${estimation.customFee ? 'selected' : ''}`}
                onChange={value => setCustomFee(value)}
                value={estimation.customFee}
              />
              {isUnderpriced &&
                <div className='underpriced-warning'>
                  <div>Custom Fee too low. You can try to "sign and send" the transaction but most probably it will fail.</div>
                  <div>Min estimated fee: &nbsp;
                    {<Button textOnly
                      onClick={() => setCustomFee(baseMinFee)}
                    >
                      {baseMinFee} {symbol} 
                    </Button>}
                    &nbsp; (~${(baseMinFeeUSD).toFixed(baseMinFeeUSD < 1 ? 4 : 2)})
                  </div>
                </div>
              }
            </div>
        }
      </div>

      <div className='fees-breakdown'>
        {(<div className='fee-row native-fee-estimation'>
          <div>
            Fee {!!discount && <span className='discount-label'>*</span>}
            {!!discount && estimation.selectedFeeToken?.symbol === 'WALLET' &&
              <a
                className="address row discount-label"
                href={walletDiscountBlogpost}
                target="_blank"
                rel="noreferrer">
                &nbsp;<MdInfoOutline />
              </a>}:
          </div>
          <div className='fee-amounts'>
            <div>
              ~${(baseFeeInUSD).toFixed(baseFeeInUSD < 1 ? 4 : 2)}
            </div>
            <div>
              {(baseFeeInFeeToken) + ' ' + estimation.selectedFeeToken.symbol}
            </div>
          </div>
        </div>)}

        {!!discount && (<div className='fee-row native-fee-estimation discount-label'>
          <div>
            You save ({discount * 100}%):
          </div>
          <div className='fee-amounts'>
            <div>
              ~${(discountInUSD).toFixed(discountInUSD < 1 ? 4 : 2)}
            </div>
            {/* <div>
              {discountInFeeToken + ' ' + estimation.selectedFeeToken.symbol}
            </div> */}
          </div>
        </div>)}

        {!!discount && (<div className='fee-row native-fee-estimation discount-label'>
          <div>
            You pay:
          </div>
          <div className='fee-amounts'>
            <div>
              ~${(feeInUSD).toFixed(feeInUSD < 1 ? 4 : 2)}
            </div>
            {/* <div>
              {feeInFeeToken + ' ' + estimation.selectedFeeToken.symbol}              
            </div> */}
          </div>
        </div>)}
      </div>
    </div>

    {!estimation.feeInUSD ?
      (<span><b>WARNING:</b> Paying fees in tokens other than {nativeAssetSymbol} is unavailable because you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>.</span>)
      : (<></>)}
  </>)
}

export function FailingTxn({ message, tooltip = '' }) {
  return (<div className='failingTxn'>
    <ToolTip label={tooltip}>
      <div className='error-title'><AiOutlineWarning></AiOutlineWarning> Warning</div>
      <div className='error-message'>{message}</div>
    </ToolTip>
  </div>)
}