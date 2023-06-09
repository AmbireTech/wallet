import { useCallback, useEffect, useRef, useState } from 'react'

import networks from 'consts/networks'

import useMovr from 'components/Wallet/CrossChain/useMovr'
import { useToasts } from 'hooks/toasts'
import { Loading, NoFundsPlaceholder } from 'components/common'
import Quotes from './Quotes/Quotes'
import GetQuotesForm from './GetQuotesForm/GetQuotesForm'

import styles from './SwapInner.module.scss'

const defaultState = {
  loading: true,
  items: [],
  selected: null
}

const getEquivalentToken = ({ fromTokens, toTokensItems }) => {
  const currentFromToken = fromTokens.items.find(({ value }) => value === fromTokens.selected)

  if (!currentFromToken) return
  const equivalentToken = toTokensItems.find(({ symbol }) => symbol === currentFromToken.symbol)

  if (!equivalentToken) return

  return equivalentToken.value
}

const SwapInner = ({
  network,
  portfolio,
  addRequest,
  selectedAccount,
  quotesConfirmed,
  setQuotesConfirmed
}) => {
  const { addToast } = useToasts()

  const { fetchChains, fetchFromTokens, fetchQuotes, fetchToTokens } = useMovr()

  const portfolioTokens = useRef([])

  const [status, setStatus] = useState({
    loading: true,
    disabled: false
  })
  const [quotes, setQuotes] = useState(null)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [toChains, setToChains] = useState(defaultState)
  const [fromTokens, setFromTokens] = useState(defaultState)
  const [toTokens, setToTokens] = useState(defaultState)
  const [amount, setAmount] = useState(0)

  const fromChain = network.chainId

  const onCancel = () => setQuotes(null)

  const onQuotesConfirmed = useCallback(
    (quoteRequest) => {
      const updatedQuotesConfirmed = [...quotesConfirmed, quoteRequest]
      setQuotesConfirmed(updatedQuotesConfirmed)
    },
    [quotesConfirmed, setQuotesConfirmed]
  )

  // On every network change we reset the state
  useEffect(() => {
    // We reset the state in a batch to avoid inconsistencies
    setStatus(() => {
      setFromTokens(defaultState)
      setToChains(defaultState)
      setToTokens(defaultState)
      setQuotes(null)

      return {
        loading: true,
        disabled: false
      }
    })
  }, [fromChain, selectedAccount])

  const loadToChains = useCallback(async () => {
    try {
      const chains = await fetchChains()
      const isSupported = chains.find(({ chainId }) => chainId === fromChain)

      // We set loading to false only after we check if the current network is supported
      setStatus({
        disabled: !isSupported,
        loading: false
      })

      // If the current network is not supported we don't load anything else
      if (!isSupported) return

      const newToChains = chains
        .filter(
          ({ chainId }) =>
            chainId !== fromChain && networks.map(({ chainId }) => chainId).includes(chainId)
        )
        .map(({ icon, chainId, name }) => ({
          icon,
          label: name,
          value: chainId
        }))

      setToChains({
        items: newToChains,
        selected: newToChains[0].value,
        loading: false
      })
    } catch (e) {
      console.error(e)
      addToast(`Error while loading chains: ${e.message || e}`, { error: true })
      setToChains(defaultState)
      setStatus({
        disabled: true,
        loading: false
      })
    }
  }, [fromChain, fetchChains, addToast])

  useEffect(() => {
    if (!fromChain || portfolio.isCurrNetworkBalanceLoading) return
    loadToChains()
  }, [selectedAccount, portfolio.isCurrNetworkBalanceLoading, loadToChains, fromChain])

  // We set portfolio tokens to the ref to avoid unnecessary re-renders (may be better to change it in the future)
  useEffect(() => {
    portfolioTokens.current = portfolio.tokens
  }, [selectedAccount, portfolio.tokens, fromChain])

  const loadFromTokens = useCallback(async () => {
    try {
      const unfilteredFromTokens = await fetchFromTokens(fromChain, toChains.selected)
      const filteredFromTokens = unfilteredFromTokens.filter(({ name }) => name)
      const uniqueFromTokenAddresses = [
        ...new Set(
          unfilteredFromTokens
            .filter(({ address }) =>
              portfolioTokens.current
                .map(({ address }) => address)
                .map((address) => (Number(address) === 0 ? `0x${'e'.repeat(40)}` : address))
                .includes(address)
            )
            .map(({ address }) => address)
        )
      ]

      const newFromTokensItems = uniqueFromTokenAddresses
        .map((address) => filteredFromTokens.find((token) => token.address === address))
        .filter((token) => token)
        .map(({ icon, name, symbol, address }) => ({
          icon,
          label: `${name} (${symbol})`,
          value: address,
          symbol
        }))

      // We want to keep the selected token, unless we have changed fromChain
      setFromTokens((prev) => ({
        items: newFromTokensItems,
        selected: prev.selected || newFromTokensItems[0]?.value,
        loading: false
      }))
    } catch (e) {
      console.error(e)
      addToast(`Error while loading from tokens: ${e.message || e}`, { error: true })
      setFromTokens(defaultState)
    }
  }, [addToast, fetchFromTokens, fromChain, toChains.selected])

  useEffect(() => {
    if (!fromChain || status.loading || status.disabled) return

    loadFromTokens()
  }, [selectedAccount, fromChain, loadFromTokens, status.disabled, status.loading])

  const loadToTokens = useCallback(async () => {
    try {
      const unfilteredToTokens = await fetchToTokens(fromChain, toChains.selected)
      const filteredToTokens = unfilteredToTokens.filter(({ name }) => name)
      const uniqueTokenAddresses = [...new Set(unfilteredToTokens.map(({ address }) => address))]
      const newToTokensItems = uniqueTokenAddresses
        .map((address) => filteredToTokens.find((token) => token.address === address))
        .filter((token) => token)
        .map(({ icon, name, symbol, address }) => ({
          icon,
          label: `${name} (${symbol})`,
          value: address,
          symbol
        }))
        .sort((a, b) => a.label.localeCompare(b.label))

      // Find an equivalent toToken, based on the fromToken
      const equivalentToken = getEquivalentToken({ fromTokens, toTokensItems: newToTokensItems })

      setToTokens({
        items: newToTokensItems,
        selected: equivalentToken || newToTokensItems[0]?.value,
        loading: false
      })
    } catch (e) {
      console.error(e)
      addToast(`Error while loading to tokens: ${e.message || e}`, { error: true })
      setToTokens(defaultState)
    }
  }, [addToast, fetchToTokens, fromChain, fromTokens, toChains.selected])

  useEffect(() => {
    if (!fromChain || status.loading || status.disabled || fromTokens.loading) return

    loadToTokens()
  }, [
    selectedAccount,
    fromChain,
    status.disabled,
    status.loading,
    fromTokens.loading,
    loadToTokens
  ])

  useEffect(() => setAmount(0), [fromTokens.selected, setAmount, fromChain])

  // sets toTokens loading to true, when fromChain, toChain or fromToken changes
  useEffect(() => {
    setToTokens((prev) => ({ ...prev, loading: true }))
  }, [toChains.selected, fromTokens.selected, setToTokens])

  if (
    status.loading ||
    portfolio.isCurrNetworkBalanceLoading ||
    loadingQuotes ||
    (fromTokens.loading && !status.disabled)
  ) {
    return <Loading />
  }
  if (status.disabled) {
    return <p className={styles.placeholder}>Not supported on this Network</p>
  }
  if (!portfolio.balance.total.full) {
    return <NoFundsPlaceholder />
  }
  if (!fromTokens.loading && !fromTokens.items.length) {
    return <p className={styles.placeholder}>You don't have any available tokens to swap</p>
  }

  return quotes ? (
    <Quotes
      addRequest={addRequest}
      selectedAccount={selectedAccount}
      fromTokensItems={fromTokens.items}
      quotes={quotes}
      onQuotesConfirmed={onQuotesConfirmed}
      onCancel={onCancel}
      amount={amount}
    />
  ) : (
    <GetQuotesForm
      portfolio={portfolio}
      selectedAccount={selectedAccount}
      setQuotes={setQuotes}
      setLoadingQuotes={setLoadingQuotes}
      fromChain={fromChain}
      amount={amount}
      setAmount={setAmount}
      fetchQuotes={fetchQuotes}
      toChains={toChains}
      setToChains={setToChains}
      toTokens={toTokens}
      fromTokens={fromTokens}
      setFromTokens={setFromTokens}
      setToTokens={setToTokens}
    />
  )
}

export default SwapInner
