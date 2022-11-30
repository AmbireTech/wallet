import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import cn from 'classnames'

import networks from 'consts/networks'

import useMovr from 'components/Wallet/CrossChain/useMovr'
import { useToasts } from 'hooks/toasts'
import { Loading, NoFundsPlaceholder, Panel } from 'components/common'
import Quotes from './Quotes/Quotes'
import GetQuotesForm from './GetQuotesForm/GetQuotesForm'

import styles from './Swap.module.scss'

const Swap = ({ network, portfolio, addRequest, selectedAccount, quotesConfirmed, setQuotesConfirmed, panelClassName }) => {
  const { addToast } = useToasts()
  
  const { fetchChains, fetchFromTokens, fetchQuotes, fetchToTokens } = useMovr()
  
  const portfolioTokens = useRef([])
  
  const [disabled, setDisabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingFromTokens, setLoadingFromTokens] = useState(false)
  const [loadingToTokens, setLoadingToTokens] = useState(false)
  const [loadingQuotes, setLoadingQuotes] = useState(false)
  const [quotes, setQuotes] = useState(null)
  const [toChain, setToChain] = useState(null)
  const [chainsItems, setChainsItems] = useState([])
  const [toTokenItems, setToTokenItems] = useState([])
  const [fromTokensItems, setFromTokenItems] = useState([])
  const [fromToken, setFromToken] = useState(null)
  const [toToken, setToToken] = useState(null)
  const [amount, setAmount] = useState(0)
  
  const fromChain = useMemo(() => network.chainId, [network.chainId])
  const hasNoFunds = !portfolio.balance.total.full
    
  const onCancel = () => setQuotes(null)

  const onQuotesConfirmed = (quoteRequest) => {
    const updatedQuotesConfirmed = [...quotesConfirmed, quoteRequest]
    setQuotesConfirmed(updatedQuotesConfirmed)
  }

  const asyncLoad = async (setStateLoading, loadCallback) => {
    setStateLoading(true)
    const loaded = await loadCallback()
    setStateLoading(!loaded)
  }

  const loadFromTokens = useCallback(async () => {
    if (!fromChain || !toChain) return

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
      setFromTokenItems(fromTokensItems)
      return true
    } catch (e) {
      console.error(e)
      addToast(`Error while loading from tokens: ${e.message || e}`, { error: true })
      return false
    }
  }, [fromChain, toChain, fetchFromTokens, addToast, setFromTokenItems])

  const loadChains = useCallback(async () => {
    try {
      const chains = await fetchChains()
      const isSupported = chains.find(({ chainId }) => chainId === fromChain)
      setDisabled(!isSupported)
      if (!isSupported) return

      const chainsItems = chains
        .filter(({ chainId }) => chainId !== fromChain && networks.map(({ chainId }) => chainId).includes(chainId))
        .map(({ icon, chainId, name }) => ({
          icon,
          label: name,
          value: chainId,
        }))
      setChainsItems(chainsItems)
      setToChain(chainsItems[0].value)
      return true
    } catch (e) {
      console.error(e)
      addToast(`Error while loading chains: ${e.message || e}`, { error: true })
      return false
    }
  }, [fromChain, fetchChains, addToast, setDisabled])

  const loadToTokens = useCallback(async () => {
    if (!fromChain || !toChain) return

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
      setToTokenItems(tokenItems)
      return true
    } catch (e) {
      console.error(e)
      addToast(`Error while loading to tokens: ${e.message || e}`, { error: true })
      return false
    }
  }, [fromChain, toChain, fetchToTokens, addToast])

  useEffect(() => {
    if (!toChain) return
    asyncLoad(setLoadingToTokens, loadToTokens)
  }, [toChain, loadToTokens, setLoadingToTokens])

  useEffect(() => {
    if (!toChain) return
    asyncLoad(setLoadingFromTokens, loadFromTokens)
  }, [toChain, loadFromTokens, setLoadingFromTokens])

  useEffect(() => {
    if (!fromChain || portfolio.isCurrNetworkBalanceLoading) return
    setQuotes(null)
    asyncLoad(setLoading, loadChains)

    return () => {
      setChainsItems([])
    }
  }, [portfolio.isCurrNetworkBalanceLoading, loadChains, setLoading, setQuotes, fromChain])

  useEffect(() => {
    if (!fromChain || portfolio.isCurrNetworkBalanceLoading) return
    setQuotes(null)
    asyncLoad(setLoading, loadChains)

    return () => {
      setChainsItems([])
    }
  }, [portfolio.isCurrNetworkBalanceLoading, loadChains, fromChain])

  useEffect(() => setAmount(0), [fromToken, setAmount])
  useEffect(() => {
    const fromTokenItem = fromTokensItems.find(({ value }) => value === fromToken)
    if (!fromTokenItem) return
    const equivalentToken = toTokenItems.find(({ symbol }) => symbol === fromTokenItem.symbol)
    if (equivalentToken) setToToken(equivalentToken.value)
  }, [fromTokensItems, toTokenItems, fromToken, setToToken])

  return (
    <Panel className={cn(panelClassName, styles.wrapper)} title="Cross-Chain transfers/swaps">
      {disabled ? (
        <div className={styles.placeholder}>Not supported on this Network</div>
      ) : loading || portfolio.isCurrNetworkBalanceLoading ? (
        <Loading />
      ) : hasNoFunds ? (
        <NoFundsPlaceholder />
      ) : !loadingFromTokens && !loadingToTokens && !fromTokensItems.length ? (
        <div className={styles.placeholder}>You don't have any available tokens to swap</div>
      ) : loadingQuotes ? (
        <Loading />
      ) : quotes ? (
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
          chainsItems={chainsItems}
          setToChain={setToChain}
          fetchQuotes={fetchQuotes}
          portfolioTokens={portfolioTokens}
        />
      )}
    </Panel>
  )
}

export default Swap
