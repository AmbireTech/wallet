import { useEffect, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import cn from 'classnames'

import { useToasts } from 'hooks/toasts'
import { NumberInput, Button, Select } from 'components/common'
import FormSection from './FormSection/FormSection'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import styles from './GetQuotesForm.module.scss'

const GetQuotesForm = ({
  portfolio,
  selectedAccount,
  setQuotes,
  fromTokensItems,
  setLoadingQuotes,
  loadingFromTokens,
  loadingToTokens,
  fromChain,
  fromToken,
  toChain,
  setToChain,
  setFromToken,
  toToken,
  setToToken,
  amount,
  setAmount,
  toTokenItems,
  chainsItems,
  fetchQuotes,
  portfolioTokens,
}) => {
  const { addToast } = useToasts()

  const formDisabled = !(fromToken && toToken && fromChain && toChain && amount > 0)
  const getTokenFromPortofolio = useCallback(
    (tokenAddress) =>
      portfolio.tokens
        .map((token) => ({
          ...token,
          address: Number(token.address) === 0 ? `0x${'e'.repeat(40)}` : token.address,
        }))
        .find(({ address }) => address === tokenAddress),
    [portfolio.tokens]
  )

  const getQuotes = useCallback(async () => {
    setLoadingQuotes(true)

    try {
      const portfolioToken = getTokenFromPortofolio(fromToken)
      if (!portfolioToken) return
      const { decimals } = portfolioToken
      const flatAmount = parseUnits(amount, decimals).toString()
      const quotes = await fetchQuotes(selectedAccount, fromToken, fromChain, toToken, toChain, flatAmount, [
        'hyphen',
        'celer',
      ]) //'anyswap-router-v4'
      setQuotes(quotes)
    } catch (e) {
      console.error(e)
      addToast(`Error while loading quotes: ${e.message || e}`, { error: true })
    }

    setLoadingQuotes(false)
  }, [addToast, amount, fetchQuotes, fromChain, fromToken, getTokenFromPortofolio, selectedAccount, setLoadingQuotes, setQuotes, toChain, toToken])

  useEffect(() => (portfolioTokens.current = portfolio.tokens), [portfolio.tokens, portfolioTokens])

  const maxAmount = useMemo(() => {
    try {
      const portfolioToken = getTokenFromPortofolio(fromToken)
      if (!portfolioToken) return 0
      const { balanceRaw, decimals } = portfolioToken
      return ethers.utils.formatUnits(balanceRaw, decimals)
    } catch (e) {
      console.error(e)
      addToast(`Error while formating amount: ${e.message || e}`, { error: true })
    }
  }, [getTokenFromPortofolio, fromToken, addToast])

  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.body, {[styles.loading]: loadingFromTokens || loadingToTokens})}>
        <FormSection isLoading={loadingFromTokens}>
          <div className={styles.fromSection}>
            <label className={styles.label}>From</label>
            <div className={styles.inputs}>
              <Select
                searchable
                defaultValue={fromToken}
                items={fromTokensItems}
                onChange={({ value }) => setFromToken(value)}
                iconClassName={styles.selectIcon}
                selectInputClassName={styles.selectInput}
              />
              <NumberInput
                min="0"
                label={
                  <div className={styles.amountLabel}>
                    Available Amount: <span>{maxAmount}</span>
                  </div>
                }
                value={amount}
                onInput={(value) => setAmount(value)}
                button="MAX"
                onButtonClick={() => setAmount(maxAmount)}
              />
            </div>
          </div>
        </FormSection>
        <SwapIcon className={styles.swapIcon} />
        <FormSection smaller={true} isLoading={loadingToTokens}>
          <div className={styles.toSection}>
            <label className={styles.label}>To</label>
            <div className={styles.inputs}>
              <Select
                searchable
                defaultValue={toChain}
                items={chainsItems}
                onChange={({ value }) => setToChain(value)}
                iconClassName={styles.selectIcon}
                selectInputClassName={styles.selectInput}
              />
              <Select
                searchable
                defaultValue={toToken}
                items={toTokenItems}
                onChange={({ value }) => setToToken(value)}
                iconClassName={styles.selectIcon}
                selectInputClassName={styles.selectInput}
              />
            </div>
          </div>
        </FormSection>
      </div>
      <Button primaryGradient={true} className={styles.button} disabled={formDisabled} onClick={getQuotes}>
        Get Quotes
      </Button>
    </div>
  )
}

export default GetQuotesForm
