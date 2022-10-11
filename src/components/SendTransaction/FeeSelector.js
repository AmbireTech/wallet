import './FeeSelector.scss'

import { AiOutlineWarning } from 'react-icons/ai'
import { Loading, Select, ToolTip, Button, TextInput, DAppIncompatibilityWarningMsg } from 'components/common'
import {
  isTokenEligible,
  mapTxnErrMsg,
  getErrHint,
  getFeesData,
  getDiscountApplied,
  checkIfDAppIncompatible
} from './helpers'
import { FaPercentage } from 'react-icons/fa'
import { MdInfoOutline } from 'react-icons/md'
import { NavLink } from 'react-router-dom'
import { MdEdit } from 'react-icons/md'
import { useState } from 'react'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { ethers } from 'ethers'

const SPEEDS = ['slow', 'medium', 'fast', 'ape']
const walletDiscountBlogpost = 'https://blog.ambire.com/move-crypto-with-ambire-pay-gas-with-wallet-and-save-30-on-fees-35dca1002697'
const OVERPRICED_MULTIPLIER = 1.2
// NOTE: Order matters for for secondary fort after the one by discount
const DISCOUNT_TOKENS_SYMBOLS = ['xWALLET', 'WALLET-STAKING', 'WALLET']

function getBalance(token) {
  const { balance, decimals, priceInUSD } = token
  return balance / decimals * priceInUSD
}

const WalletDiscountBanner = ({ currenciesItems, tokens, estimation, onFeeCurrencyChange, onDismiss, feeSpeed, isGasTankEnabled, network }) => {
  if (estimation.selectedFeeToken?.symbol
    && (DISCOUNT_TOKENS_SYMBOLS.includes(estimation.selectedFeeToken?.symbol)
      || estimation.selectedFeeToken.discount)
  ) {
    return null
  }
  const walletDiscountTokens = [...tokens]
    .filter(x => DISCOUNT_TOKENS_SYMBOLS.includes(x.symbol) && x.discount && isTokenEligible(x, feeSpeed, estimation, isGasTankEnabled, network))
    .sort((a, b) =>
      b.discount - a.discount
      || ((!parseInt(a.balance) || !parseInt(b.balance)) ? getBalance(b) - getBalance(a) : 0)
      || DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol)
    )

  if (!walletDiscountTokens.length) return null

  const discountToken = walletDiscountTokens[0]

  const { discount } = discountToken
  const eligibleWalletToken = currenciesItems.find(x => x.value && (x.value === 'WALLET' || x.value === discountToken.address))
  const action = !!eligibleWalletToken
    ? () => onFeeCurrencyChange(eligibleWalletToken)
    : null
  //TODO: go to swap 
  const actionTxt = !!eligibleWalletToken ? `USE ${discountToken.symbol}` : `BUY ${discountToken.symbol}`
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

const mapGasTankTokens = nativePrice => item => {
  const nativeRate = item.address === '0x0000000000000000000000000000000000000000' ? null : nativePrice / item.price
  return {
    ...item,
    symbol: item.symbol.toUpperCase(),
    balance: ethers.utils.parseUnits(
      item.balance.toFixed(item.decimals).toString(),
      item.decimals
    ).toString(),
    nativeRate
  }
}

export function FeeSelector({ disabled, signer, estimation, network, setEstimation, feeSpeed, setFeeSpeed, onDismiss, isGasTankEnabled }) {
  const [editCustomFee, setEditCustomFee] = useState(false)
  if (!estimation) return (<Loading />)
  // Only check for insufficient fee in relayer mode (.feeInUSD is available)
  // Otherwise we don't care whether the user has enough for fees, their signer wallet will take care of it
  const insufficientFee = estimation && estimation.feeInUSD
    && !isTokenEligible(estimation.selectedFeeToken, feeSpeed, estimation, isGasTankEnabled, network)
  if (estimation && !estimation.success) return (!checkIfDAppIncompatible(estimation.message) ?
    <FailingTxn
      message={<>The current transaction batch cannot be sent because it will fail: {mapTxnErrMsg(estimation.message)}</>}
      tooltip={getErrHint(estimation.message)}
    /> : <DAppIncompatibilityWarningMsg 
            title={'Unable to send transaction'}
            msg={getErrHint(estimation.message)}
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
  const gasTankTokens = estimation.gasTank?.map(mapGasTankTokens(estimation.nativeAssetPriceInUSD))
  const tokens = (isGasTankEnabled && gasTankTokens?.length)
    ? gasTankTokens
    // fallback to the native asset if fee tokens cannot be retrieved for wh  atever reason
    : estimation.remainingFeeTokenBalances || [{ symbol: nativeAssetSymbol, decimals: 18, address: '0x0000000000000000000000000000000000000000' }]

  const onFeeCurrencyChange = ({ value, label}) => {
    const token = tokens.find(({ address, symbol }) => (address === value) && (symbol === label))
    setEstimation({ ...estimation, selectedFeeToken: token })
  }

  const currenciesItems = tokens
    // NOTE: filter by slowest and then will disable the higher fees speeds otherwise 
    // it will just hide the token from the select
    .sort((a, b) =>
    (isTokenEligible(b, SPEEDS[0], estimation, isGasTankEnabled, network) - isTokenEligible(a, SPEEDS[0], estimation, isGasTankEnabled, network))
    || (DISCOUNT_TOKENS_SYMBOLS.indexOf(b.symbol) - DISCOUNT_TOKENS_SYMBOLS.indexOf(a.symbol))
    || ((b.discount || 0) - (a.discount || 0))
    || a?.symbol.toUpperCase().localeCompare(b?.symbol.toUpperCase())
  )
    .map(({ address, symbol, discount, network: tokenNetwork, icon, ...rest }) => ({
      disabled: !isTokenEligible({address, symbol, discount, ...rest }, SPEEDS[0], estimation, isGasTankEnabled, network),
      icon: icon || (address ? getTokenIcon(isGasTankEnabled ? tokenNetwork : network.id, address) : null),
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

  const { discount = 0, symbol, nativeRate = null, decimals } = estimation.selectedFeeToken || {}

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
    const sufficientSpeeds = SPEEDS.filter((speed, i) => isTokenEligible(estimation.selectedFeeToken, speed, estimation, isGasTankEnabled, network))
    const highestSufficientSpeed = sufficientSpeeds[sufficientSpeeds.length - 1]
    setFeeSpeed(highestSufficientSpeed)
  }

  const checkIsSelectorDisabled = speed => {
    const insufficientFee = !isTokenEligible(estimation.selectedFeeToken, speed, estimation, isGasTankEnabled, network)
    return disabled || insufficientFee
  }

  const feeAmountSelectors = SPEEDS.map(speed => {
    const isETH = symbol === 'ETH' && nativeAssetSymbol === 'ETH'
    const {
      feeInFeeToken,
      feeInUSD,
      // NOTE: get the estimation res data w/o custom fee for the speeds
    } = getFeesData({ ...estimation.selectedFeeToken }, { ...estimation, customFee: null }, speed, isGasTankEnabled, network)
    const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
    const discountInFeeInUSD = getDiscountApplied(feeInUSD, discount)

    const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
    const baseFeeInFeeUSD = feeInUSD ? feeInUSD + discountInFeeInUSD : null

    const showInUSD = (nativeRate !== null) && baseFeeInFeeUSD

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
            + (showInUSD ? `$${formatFloatTokenAmount(baseFeeInFeeUSD, true, 4)}` : formatFloatTokenAmount(baseFeeInFeeToken, true, decimals))
            + (!isETH && !showInUSD ? ` ${estimation.selectedFeeToken.symbol}` : '')
          }
        </div>
        {!isETH && !showInUSD && <div className='feeEstimation symbol'>
          {estimation.selectedFeeToken.symbol}
        </div>}
      </div>
    )
  })

  const {
    feeInFeeToken,
    feeInUSD,
    savedGas,
  } = getFeesData(estimation.selectedFeeToken, estimation, feeSpeed, isGasTankEnabled, network)

  const {
    feeInFeeToken: minFee,
    feeInUSD: minFeeUSD,
  } = getFeesData({ ...estimation.selectedFeeToken }, { ...estimation, customFee: null }, 'slow', isGasTankEnabled, network)

  const {
    feeInFeeToken: maxFee,
    feeInUSD: maxFeeUSD,
  } = getFeesData({ ...estimation.selectedFeeToken }, { ...estimation, customFee: null }, 'ape', isGasTankEnabled, network)

  const discountMin = getDiscountApplied(minFee, discount)
  const discountMax = getDiscountApplied(maxFee, discount)

  const discountInFeeToken = getDiscountApplied(feeInFeeToken, discount)
  const discountInUSD = getDiscountApplied(feeInUSD, discount)
  const discountBaseMinInUSD = getDiscountApplied(minFeeUSD, discount)
  const discountBaseMaxInUSD = getDiscountApplied(maxFeeUSD, discount)

  // Fees with no discounts applied
  const baseFeeInFeeToken = feeInFeeToken + discountInFeeToken
  const baseFeeInUSD = feeInUSD + discountInUSD
  const baseMinFee = minFee + discountMin
  const baseMaxFee = (maxFee + discountMax) * OVERPRICED_MULTIPLIER
  const baseMinFeeUSD = minFeeUSD + discountBaseMinInUSD
  const baseMaxFeeUSD = (maxFeeUSD + discountBaseMaxInUSD) * OVERPRICED_MULTIPLIER

  const isUnderpriced = !!estimation.customFee
    && !isNaN(parseFloat(estimation.customFee))
    && (baseFeeInFeeToken < baseMinFee)

  const isOverpriced = !!estimation.customFee
    && !isNaN(parseFloat(estimation.customFee))
    && (baseFeeInFeeToken > baseMaxFee)

  return (<>
    {insufficientFee ?
      (<div className='balance-error'>
        Insufficient balance for the fee.<br />Accepted tokens: {(estimation.remainingFeeTokenBalances || []).map(x => x.symbol).join(', ')}
        { isGasTankEnabled && <div>Disable your Gas Tank to use the default fee tokens.</div> }
      </div>)
      : feeCurrencySelect
    }

    {WalletDiscountBanner({
      selectedFeeToken: estimation.selectedFeeToken,
      currenciesItems,
      tokens,
      estimation,
      onFeeCurrencyChange,
      onDismiss,
      feeSpeed,
      isGasTankEnabled,
      network
    })}

    <div className='section-title'>
      <span>Transaction Speed</span>
      { network.isGasTankAvailable && 
        <span>Gas Tank: { isGasTankEnabled ? 
          (<span className='gas-tank-enabled'>Enabled</span>) : 
          (<span className='gas-tank-disabled'>Disabled</span>)}
        </span> 
      }
    </div>
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
                <div className='price-warning'>
                  <div>Custom Fee too low. You can try to "sign and send" the transaction but most probably it will fail.</div>
                  <div>Min estimated fee: &nbsp;
                    {<Button textOnly
                      onClick={() => setCustomFee(baseMinFee)}
                    >
                      {baseMinFee} {symbol}
                    </Button>}
                    {!isNaN(baseMinFeeUSD) &&
                      <span>&nbsp; (~${formatFloatTokenAmount(baseMinFeeUSD, true, 4)}) </span>
                    }
                  </div>
                </div>
              }
              {isOverpriced &&
                <div className='price-warning'>
                  <div>Custom Fee is higher than the APE speed. You will pay more than probably needed. Make sure you know what are you doing!</div>
                  <div>Recommended max fee: &nbsp;
                    {<Button textOnly
                      onClick={() => setCustomFee(baseMaxFee)}
                    >
                      {baseMaxFee} {symbol}
                    </Button>}
                    {!isNaN(baseMaxFeeUSD) &&
                      <span>&nbsp; (~${formatFloatTokenAmount(baseMaxFeeUSD, true, 4)}) </span>
                    }
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
            {!!(discount && DISCOUNT_TOKENS_SYMBOLS.includes(estimation.selectedFeeToken?.symbol)) &&
              <a
                className="address row discount-label"
                href={walletDiscountBlogpost}
                target="_blank"
                rel="noreferrer">
                &nbsp;<MdInfoOutline />
              </a>}:
          </div>
          <div className='fee-amounts'>
            {!isNaN(baseFeeInUSD) &&
              <div>
                ~${formatFloatTokenAmount(baseFeeInUSD, true, 4)}
              </div>
            }
            {!isNaN(baseFeeInFeeToken) && <div>
              {formatFloatTokenAmount(baseFeeInFeeToken, true, decimals) + ' ' + estimation?.selectedFeeToken?.symbol}
            </div>
            }
          </div>
        </div>)}

        {!!discount && (<div className='fee-row native-fee-estimation discount-label'>
          <div>
            You save ({discount * 100}%):
          </div>
          <div className='fee-amounts'>
            <div>
              ~${formatFloatTokenAmount(discountInUSD, true, 4)}
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
              ~${formatFloatTokenAmount(feeInUSD, true, 4)}
            </div>
          </div>
        </div>)}
        {!isGasTankEnabled && !isNaN((feeInUSD / estimation.gasLimit) * savedGas) && 
            <div className='fee-row native-fee-estimation warning-label'>
              <div>
              Enable Gas Tank to save:
              </div>
              <div className='fee-amounts'>
                <div>
                  ${formatFloatTokenAmount(((feeInUSD / estimation.gasLimit) * savedGas), true, 4)}
                </div>
              </div>
            </div>}
        {!!isGasTankEnabled && (<>
          <div className='fee-row native-fee-estimation discount-label'>
            <div>
              Gas Tank fee token balance:
            </div>
            <div className='fee-amounts'>
              <div>
                ${formatFloatTokenAmount(estimation.selectedFeeToken.balanceInUSD, true, 4)}
              </div>
            </div>
          </div>
         {!isNaN((feeInUSD / estimation.gasLimit) * savedGas) && 
            <div className='fee-row native-fee-estimation discount-label'>
              <div>
                Gas Tank saves you:
              </div>
              <div className='fee-amounts'>
                <div>
                  ${formatFloatTokenAmount(((feeInUSD / estimation.gasLimit) * savedGas), true, 4)}
                </div>
              </div>
            </div>}
        </>)}
      </div>
    </div>

    {!estimation.feeInUSD ?
      (<span className='no-relayer-msg'><b>WARNING:</b> Paying fees in tokens other than {nativeAssetSymbol} is unavailable because you are not connected to a relayer. You will pay the fee from <b>{signer.address}</b>.</span>)
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