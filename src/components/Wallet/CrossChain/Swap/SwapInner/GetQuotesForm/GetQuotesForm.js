import { useCallback, useMemo } from 'react'
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
  setLoadingQuotes,
  fromChain,
  amount,
  setAmount,
  fetchQuotes,
  toChains,
  setToChains,
  toTokens,
  fromTokens,
  setFromTokens,
  setToTokens,
}) => {
  const { addToast } = useToasts()

  const formDisabled = !(fromTokens.selected && toTokens.selected && fromChain && toChains.selected && amount > 0)
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
      const portfolioToken = getTokenFromPortofolio(fromTokens.selected)
      if (!portfolioToken) return
      const { decimals } = portfolioToken
      const flatAmount = parseUnits(amount, decimals).toString()
      const quotes = await fetchQuotes(selectedAccount, fromTokens.selected, fromChain, toTokens.selected, toChains.selected, flatAmount, [
        'stargate'
      ])
      setQuotes(quotes)
    } catch (e) {
      console.error(e)
      addToast(`Error while loading quotes: ${e.message || e}`, { error: true })
    }

    setLoadingQuotes(false)
  }, [addToast, amount, fetchQuotes, fromChain, getTokenFromPortofolio, selectedAccount, setLoadingQuotes, setQuotes, toChains.selected, fromTokens.selected, toTokens.selected])

  const maxAmount = useMemo(() => {
    try {
      const portfolioToken = getTokenFromPortofolio(fromTokens.selected)
      if (!portfolioToken) return 0
      const { balanceRaw, decimals } = portfolioToken
      return ethers.utils.formatUnits(balanceRaw, decimals)
    } catch (e) {
      console.error(e)
      addToast(`Error while formating amount: ${e.message || e}`, { error: true })
    }
  }, [getTokenFromPortofolio, fromTokens.selected, addToast])

  return (
    <div className={styles.wrapper}>
      <div className={cn(styles.body, {[styles.loading]: fromTokens.loading || toTokens.loading})}>
        <FormSection className={styles.fromSection} inputsClassName={styles.inputs} label="From" isLoading={fromTokens.loading}>
          <Select
            searchable
            defaultValue={fromTokens.selected}
            items={fromTokens.items}
            onChange={({ value }) => setFromTokens((prev) => ({...prev, selected: value}))}
            iconClassName={styles.selectIcon}
            selectInputClassName={styles.selectInput}
          />
          <NumberInput
            min="0"
            label={
              <p className={styles.amountLabel}>
                Available Amount: <span>{maxAmount}</span>
              </p>
            }
            value={amount}
            onInput={(value) => setAmount(value)}
            button="MAX"
            onButtonClick={() => setAmount(maxAmount)}
          />
        </FormSection>
        <SwapIcon className={styles.swapIcon} />
        <FormSection label="To" isLoading={toTokens.loading || toChains.loading} isLoadingSmaller>
          <Select
            searchable
            defaultValue={toChains.selected}
            items={toChains.items}
            onChange={({ value }) => setToChains((prev) => ({...prev, selected: value}))}
            iconClassName={styles.selectIcon}
            selectInputClassName={styles.selectInput}
          />
          <Select
            searchable
            defaultValue={toTokens.selected}
            items={toTokens.items}
            onChange={({ value }) => setToTokens((prev) => ({...prev, selected: value}))}
            iconClassName={styles.selectIcon}
            selectInputClassName={styles.selectInput}
          />
        </FormSection>
      </div>
      <Button variant="primaryGradient" className={styles.button} disabled={formDisabled} onClick={getQuotes}>
        Get Quotes
      </Button>
    </div>
  )
}

export default GetQuotesForm
