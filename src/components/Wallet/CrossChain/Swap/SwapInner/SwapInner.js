import { useCallback, useEffect, useRef, useState } from 'react'

import networks from 'consts/networks'

import useMovr from 'components/Wallet/CrossChain/useMovr'
import { useToasts } from 'hooks/toasts'
import { Loading, NoFundsPlaceholder } from 'components/common'
import Quotes from './Quotes/Quotes'
import GetQuotesForm from './GetQuotesForm/GetQuotesForm'

import styles from './SwapInner.module.scss'

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

  const [disabled, setDisabled] = useState(false)
  const [loadingToChains, setLoadingToChains] = useState(true)
  const [loadingFromTokens, setLoadingFromTokens] = useState(true) // We set it to true to avoid empty fromToken on initial load
  const [loadingToTokens, setLoadingToTokens] = useState(true)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [quotes, setQuotes] = useState(null)
  const [toChain, setToChain] = useState(null)
  const [toChains, setToChains] = useState([])
  const [toTokenItems, setToTokenItems] = useState([])
  const [fromTokensItems, setFromTokenItems] = useState([])
  const [fromToken, setFromToken] = useState(null)
  const [toToken, setToToken] = useState(null)
  const [amount, setAmount] = useState(0)

  const fromChain = network.chainId

  const onCancel = () => setQuotes(null)

  const onQuotesConfirmed = useCallback((quoteRequest) => {
    const updatedQuotesConfirmed = [...quotesConfirmed, quoteRequest]
    setQuotesConfirmed(updatedQuotesConfirmed)
  }, [quotesConfirmed, setQuotesConfirmed])

  // On every network change
  useEffect(() => {
    setLoadingFromTokens(true) // We set loading for fromTokens only here to avoid loading when changing toChain
    setLoading(true) // We set loading for everything to true until we determine if the network is supported(happens in loadToChains)
  }, [fromChain])

  const loadToChains = useCallback(async () => {
    setLoadingToChains(true)
    setDisabled(false) // We set disabled back to false to prevent glitching when switching networks

    try {
      const chains = await fetchChains()
      const isSupported = chains.find(({ chainId }) => chainId === fromChain)
      setLoading(() => {
        // We make sure that loading is set to false only after we know if the network is supported
        setDisabled(!isSupported)
        return false
      }) 
      if (!isSupported) return

      const toChains = chains
        .filter(({ chainId }) => chainId !== fromChain && networks.map(({ chainId }) => chainId).includes(chainId))
        .map(({ icon, chainId, name }) => ({
          icon,
          label: name,
          value: chainId,
        }))

      setLoadingToChains(() => {
        setToChain(toChains[0].value)
        setToChains(toChains)
        return false
      })
    } catch (e) {
      console.error(e)
      addToast(`Error while loading chains: ${e.message || e}`, { error: true })
      setLoadingToChains(true)
    }
  }, [fromChain, fetchChains, addToast, setDisabled])

  useEffect(() => {
    if (!fromChain || portfolio.isCurrNetworkBalanceLoading) return
    setQuotes(null)
    loadToChains()

    return () => {
      setToChains([])
    }
  }, [portfolio.isCurrNetworkBalanceLoading, loadToChains, setQuotes, fromChain])
  
  const loadFromTokens = useCallback(async () => {
    try {
      const fromTokens = await fetchFromTokens(fromChain, toChain)
      const filteredFromTokens = fromTokens.filter(({ name }) => name)
      const uniqueFromTokenAddresses = [
        ...new Set(
          fromTokens
            .filter(({ address }) =>
              portfolioTokens.current
                .map(({ address }) => address)
                .map((address) => (Number(address) === 0 ? `0x${'e'.repeat(40)}` : address))
                .includes(address)
            )
            .map(({ address }) => address)
        ),
      ]

      const fromTokensItems = uniqueFromTokenAddresses
        .map((address) => filteredFromTokens.find((token) => token.address === address))
        .filter((token) => token)
        .map(({ icon, name, symbol, address }) => ({
          icon,
          label: `${name} (${symbol})`,
          value: address,
          symbol,
        }))
      setLoadingFromTokens(() => {
        setFromTokenItems(fromTokensItems)
        return false
      })
    } catch (e) {
      console.error(e)
      addToast(`Error while loading from tokens: ${e.message || e}`, { error: true })
      setLoadingFromTokens(true)
    }
  }, [fromChain, toChain, fetchFromTokens, addToast, setFromTokenItems])

  const loadToTokens = useCallback(async () => {
    setLoadingToTokens(true)

    try {
      const toTokens = await fetchToTokens(fromChain, toChain)
      const filteredToTokens = toTokens.filter(({ name }) => name)
      const uniqueTokenAddresses = [...new Set(toTokens.map(({ address }) => address))]
      const tokenItems = uniqueTokenAddresses
        .map((address) => filteredToTokens.find((token) => token.address === address))
        .filter((token) => token)
        .map(({ icon, name, symbol, address }) => ({
          icon,
          label: `${name} (${symbol})`,
          value: address,
          symbol,
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
      setLoadingToTokens(() => {
        setToTokenItems(tokenItems)
        return false
      })
    } catch (e) {
      console.error(e)
      addToast(`Error while loading to tokens: ${e.message || e}`, { error: true })
      setLoadingToTokens(true)
    }
  }, [fromChain, toChain, fetchToTokens, addToast])

  useEffect(() => {
    if (!fromChain || !toChain || portfolio.isCurrNetworkBalanceLoading) return
    // We only load the tokens if the network is supported
    if (!loading && !disabled) {
      loadFromTokens()
      loadToTokens()
    }
  }, [toChain, loadFromTokens, loadToTokens, portfolio.isCurrNetworkBalanceLoading, setLoadingFromTokens, fromChain, disabled, loading])

  useEffect(() => setAmount(0), [fromToken, setAmount, fromChain])

  useEffect(() => {
    if (loadingToTokens) return

    const fromTokenItem = fromTokensItems.find(({ value }) => value === fromToken)
    if (!fromTokenItem) return
    const equivalentToken = toTokenItems.find(({ symbol }) => symbol === fromTokenItem.symbol)
    if (equivalentToken) setToToken(equivalentToken.value)
  }, [fromTokensItems, toTokenItems, fromToken, setToToken, loadingToTokens])
    
  if (loading || portfolio.isCurrNetworkBalanceLoading || loadingQuotes) {
    return <Loading />
  } else if (disabled) {
    return <p className={styles.placeholder}>Not supported on this Network</p>
  } else if (!loadingFromTokens && !fromTokensItems.length) {
    return <p className={styles.placeholder}>You don't have any available tokens to swap</p>
  } else if (!portfolio.balance.total.full) {
    return <NoFundsPlaceholder />
  }
  
  return quotes ? (
    <Quotes
      addRequest={addRequest}
      selectedAccount={selectedAccount}
      fromTokensItems={fromTokensItems}
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
      fromTokensItems={fromTokensItems}
      setLoadingQuotes={setLoadingQuotes}
      loadingFromTokens={loadingFromTokens}
      loadingToTokens={loadingToTokens}
      fromChain={fromChain}
      toChain={toChain}
      fromToken={fromToken}
      setFromToken={setFromToken}
      toToken={toToken}
      setToToken={setToToken}
      amount={amount}
      setAmount={setAmount}
      toTokenItems={toTokenItems}
      toChains={toChains}
      loadingToChains={loadingToChains}
      setToChain={setToChain}
      fetchQuotes={fetchQuotes}
      portfolioTokens={portfolioTokens}
    />
  )
}

export default SwapInner