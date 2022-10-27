import './CrossChain.scss'

import { BsArrowDown } from 'react-icons/bs'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ethers } from 'ethers'
import { parseUnits } from 'ethers/lib/utils'
import { NumberInput, Button, Select, Loading, NoFundsPlaceholder, Panel } from 'components/common'
import useMovr from './useMovr'
import networks from 'consts/networks'
import { useToasts } from 'hooks/toasts'
import { useLocalStorage } from 'hooks'
import Quotes from './Quotes/Quotes'
import History from './History/History'

const CrossChain = ({ addRequest, selectedAccount, portfolio, network, relayerURL }) => {
    const { addToast } = useToasts()
    const { fetchChains, fetchFromTokens, fetchQuotes, fetchToTokens } = useMovr()

    const [disabled, setDisabled] = useState(false)
    const [loading, setLoading] = useState(true)
    const [loadingFromTokens, setLoadingFromTokens] = useState(false)
    const [loadingToTokens, setLoadingToTokens] = useState(false)
    const [loadingQuotes, setLoadingQuotes] = useState(false)

    const [fromTokensItems, setFromTokenItems] = useState([])
    const [fromToken, setFromToken] = useState(null)
    const [amount, setAmount] = useState(0)
    const [chainsItems, setChainsItems] = useState([])
    const [toChain, setToChain] = useState(null)
    const [toTokenItems, setToTokenItems] = useState([])
    const [toToken, setToToken] = useState(null)
    const [quotes, setQuotes] = useState(null)
    const portfolioTokens = useRef([])
    const [quotesConfirmed, setQuotesConfirmed] = useLocalStorage({ key: 'quotesConfirmed', defaultValue: [] })

    const fromChain = useMemo(() => network.chainId, [network.chainId])
    const formDisabled = !(fromToken && toToken && fromChain && toChain && amount > 0)
    const hasNoFunds = !portfolio.balance.total.full
    const getTokenFromPortofolio = useCallback(tokenAddress => portfolio.tokens
        .map(token => ({
            ...token,
            address: Number(token.address) === 0 ? `0x${'e'.repeat(40)}` : token.address
        }))
        .find(({ address }) => address === tokenAddress), [portfolio.tokens])

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
                    value: chainId
                }))
            setChainsItems(chainsItems)
            setToChain(chainsItems[0].value)
            return true
        } catch(e) {
            console.error(e);
            addToast(`Error while loading chains: ${e.message || e}`, { error: true })
            return false
        }
    }, [fromChain, fetchChains, addToast])

    const loadFromTokens = useCallback(async () => {
        if (!fromChain || !toChain) return

        try {
            const fromTokens = await fetchFromTokens(fromChain, toChain)
            const filteredFromTokens = fromTokens.filter(({ name }) => name)
            const uniqueFromTokenAddresses = [
                ...new Set(fromTokens
                    .filter(({ address }) => portfolioTokens.current
                        .map(({ address }) => address)
                        .map(address => Number(address) === 0 ? `0x${'e'.repeat(40)}` : address).includes(address))
                    .map(({ address }) => address)
                )
            ]

            const fromTokensItems = uniqueFromTokenAddresses
                .map(address => filteredFromTokens.find(token => token.address === address))
                .filter(token => token)
                .map(({ icon, name, symbol, address }) => ({
                    icon,
                    label: `${name} (${symbol})`,
                    value: address,
                    symbol
                }))
            setFromTokenItems(fromTokensItems)
            return true
        } catch(e) {
            console.error(e);
            addToast(`Error while loading from tokens: ${e.message || e}`, { error: true })
            return false
        }
    }, [fromChain, toChain, fetchFromTokens, addToast])

    const loadToTokens = useCallback(async () => {
        if (!fromChain || !toChain) return

        try {
            const toTokens = await fetchToTokens(fromChain, toChain)
            const filteredToTokens = toTokens.filter(({ name }) => name)
            const uniqueTokenAddresses = [...new Set(toTokens.map(({ address }) => address))]
            const tokenItems = uniqueTokenAddresses
                .map(address => filteredToTokens.find(token => token.address === address))
                .filter(token => token)
                .map(({ icon, name, symbol, address }) => ({
                    icon,
                    label: `${name} (${symbol})`,
                    value: address,
                    symbol
                }))
                .sort((a, b) => a.label.localeCompare(b.label))
            setToTokenItems(tokenItems)
            return true
        } catch(e) {
            console.error(e);
            addToast(`Error while loading to tokens: ${e.message || e}`, { error: true })
            return false
        }
    }, [fromChain, toChain, fetchToTokens, addToast])

    const maxAmount = useMemo(() => {
        try {
            const portfolioToken = getTokenFromPortofolio(fromToken)
            if (!portfolioToken) return 0
            const { balanceRaw, decimals } = portfolioToken
            return ethers.utils.formatUnits(balanceRaw, decimals)
        } catch(e) {
            console.error(e);
            addToast(`Error while formating amount: ${e.message || e}`, { error: true })
        }
    }, [getTokenFromPortofolio, fromToken, addToast])

    const getQuotes = async () => {
        setLoadingQuotes(true)

        try {
            const portfolioToken = getTokenFromPortofolio(fromToken)
            if (!portfolioToken) return
            const { decimals } = portfolioToken
            const flatAmount = parseUnits(amount, decimals).toString()
            const quotes = await fetchQuotes(fromToken, fromChain, toToken, toChain, flatAmount, ['hyphen', 'celer']) //'anyswap-router-v4'
            setQuotes(quotes)
        } catch(e) {
            console.error(e);
            addToast(`Error while loading quotes: ${e.message || e}`, { error: true })
        }

        setLoadingQuotes(false)
    }

    const onQuotesConfirmed = quoteRequest => {
        const updatedQuotesConfirmed = [...quotesConfirmed, quoteRequest]
        setQuotesConfirmed(updatedQuotesConfirmed)
    }

    useEffect(() => setAmount(0), [fromToken])
    useEffect(() => {
        const fromTokenItem = fromTokensItems.find(({ value }) => value === fromToken)
        if (!fromTokenItem) return
        const equivalentToken = toTokenItems.find(({ symbol }) => symbol === fromTokenItem.symbol)
        if (equivalentToken) setToToken(equivalentToken.value)
    }, [fromTokensItems, toTokenItems, fromToken])

    const asyncLoad = async (setStateLoading, loadCallback) => {
        setStateLoading(true)
        const loaded = await loadCallback()
        setStateLoading(!loaded)
    }

    useEffect(() => {
        if (!toChain) return
        asyncLoad(setLoadingToTokens, loadToTokens)
    }, [toChain, loadToTokens])

    useEffect(() => {
        if (!toChain) return
        asyncLoad(setLoadingFromTokens, loadFromTokens)
    }, [toChain, loadFromTokens])

    useEffect(() => {
        if (!fromChain || portfolio.isCurrNetworkBalanceLoading) return
        setQuotes(null)
        asyncLoad(setLoading, loadChains)

        return () => {
            setChainsItems([])
        }
    }, [fromChain, portfolio.isCurrNetworkBalanceLoading, loadChains])

    useEffect(() => portfolioTokens.current = portfolio.tokens, [portfolio.tokens])

    const amountLabel = <div className="amount-label">Available Amount: <span>{ maxAmount }</span></div>

    return (
        <div id="cross-chain">
            <Panel className='panel' title="Cross-chain transfers/swaps">
                {
                    disabled ?
                        <div className="placeholder">Not supported on this Network</div>
                        :
                        loading || portfolio.isCurrNetworkBalanceLoading ?
                            <Loading/>
                            :
                            hasNoFunds ?
                                <NoFundsPlaceholder/>
                                :
                                !loadingFromTokens && !loadingToTokens && !fromTokensItems.length ?
                                    <div className="placeholder">You don't have any available tokens to swap</div>
                                    :
                                    loadingQuotes ?
                                            <Loading/>
                                            :
                                            quotes ?
                                                <Quotes
                                                    addRequest={addRequest}
                                                    selectedAccount={selectedAccount}
                                                    fromTokensItems={fromTokensItems}
                                                    quotes={quotes}
                                                    onQuotesConfirmed={onQuotesConfirmed}
                                                    onCancel={() => setQuotes(null)}
                                                />
                                                :
                                                <div className="form">
                                                    <label>From</label>
                                                    <div className="inputs">
                                                        { loadingFromTokens ? <Loading/> : null }
                                                        <Select searchable defaultValue={fromToken} items={fromTokensItems} onChange={({ value }) => setFromToken(value)}/>
                                                        <NumberInput min="0" label={amountLabel} value={amount} onInput={value => setAmount(value)} button="MAX" onButtonClick={() => setAmount(maxAmount)}/>
                                                    </div>
                                                    <div className="separator">
                                                        <BsArrowDown/>
                                                    </div>
                                                    <label>To</label>
                                                    <div className="inputs">
                                                        { loadingToTokens ? <Loading/> : null }
                                                        <Select searchable defaultValue={toChain} items={chainsItems} onChange={({ value }) => setToChain(value)}/>
                                                        <Select searchable defaultValue={toToken} items={toTokenItems} onChange={({ value }) => setToToken(value)}/>
                                                    </div>
                                                    <Button primaryGradient={true} className='buttonComponent' disabled={formDisabled} onClick={getQuotes}>Get Quotes</Button>
                                                </div>
                }
            </Panel>
            <History
                network={network}
                account={selectedAccount}
                quotesConfirmed={quotesConfirmed}
                relayerURL={relayerURL}
            />
        </div>
    )
}

export default CrossChain
