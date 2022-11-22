import { useEffect, useState, useCallback, useMemo } from 'react'

import { parseUnits } from 'ethers/lib/utils'
import { useToasts } from 'hooks/toasts'

import { ReactComponent as SwapIcon } from 'resources/icons/cross-chain.svg'

import { NumberInput, Button, Select, Loading } from 'components/common'

import styles from './GetQuotesForm.module.scss'
import { ethers } from 'ethers'

const GetQuotesForm = ({
  portfolio,
  selectedAccount,
  setQuotes,
  fromTokensItems,
  setLoadingQuotes,
  loadingFromTokens,
  loadingToTokens,
  fromChain,
  toChain,
  toTokenItems,
  chainsItems,
  setToChain,
  fetchQuotes,
  portfolioTokens,
}) => {
  const { addToast } = useToasts()

  const [fromToken, setFromToken] = useState(null)
  const [amount, setAmount] = useState(0)

  const [toToken, setToToken] = useState(null)

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

  const getQuotes = async () => {
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
  }

  useEffect(() => setAmount(0), [fromToken])
  useEffect(() => {
    const fromTokenItem = fromTokensItems.find(({ value }) => value === fromToken)
    if (!fromTokenItem) return
    const equivalentToken = toTokenItems.find(({ symbol }) => symbol === fromTokenItem.symbol)
    if (equivalentToken) setToToken(equivalentToken.value)
  }, [fromTokensItems, toTokenItems, fromToken])

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
      <div className={styles.body}>
        <div className={styles.fromSection}>
          <label className={styles.label}>From</label>
          <div className={styles.inputs}>
            {loadingFromTokens ? <Loading /> : null}
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
        <SwapIcon className={styles.separator} />
        <div className={styles.toSection}>
          <label className={styles.label}>To</label>
          <div className={styles.inputs}>
            {loadingToTokens ? <Loading /> : null}
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
      </div>
      <Button primaryGradient={true} className={styles.button} disabled={formDisabled} onClick={getQuotes}>
        Get Quotes
      </Button>
    </div>
  )
}

export default GetQuotesForm
