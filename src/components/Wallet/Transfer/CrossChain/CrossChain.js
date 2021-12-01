import './CrossChain.scss'

import { BsArrowDown } from 'react-icons/bs'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import { NumberInput, Button, Select, Loading } from '../../../common'
import { fetchChains, fetchFromTokens, fetchQuotes, fetchToTokens } from '../../../../services/movr'
import networks from '../../../../consts/networks'
import { useToasts } from '../../../../hooks/toasts'
import NoFundsPlaceholder from '../NoFundsPlaceholder/NoFundsPlaceholder'
import Quotes from './Quotes/Quotes'

const CrossChain = ({ addRequest, selectedAccount, portfolio, network }) => {
    const { addToast } = useToasts()

    const [disabled, setDisabled] = useState(false)
    const [loading, setLoading] = useState(true)
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
    
    const fromChain = useMemo(() => network.chainId, [network.chainId])
    const formDisabled = !(fromToken && toToken && fromChain && toChain && amount > 0)
    const hasNoFunds = !portfolio.balance.total.full
    const getTokenFromPortofolio = useCallback(tokenAddress => portfolio.tokens
        .map(token => ({
            ...token,
            address: token.address === `0x${'0'.repeat(40)}` ? `0x${'e'.repeat(40)}` : token.address
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
    }, [fromChain, addToast])

    const loadFromTokens = useCallback(async () => {
        if (!fromChain || !toChain) return

        try {
            const fromTokens = await fetchFromTokens(fromChain, toChain)
            const filteredFromTokens = fromTokens.filter(({ name }) => name)
            const uniqueFromTokenAddresses = [
                ...new Set(fromTokens
                    .filter(({ address }) => portfolio.tokens
                        .map(({ address }) => address)
                        .map(address => address === `0x${'0'.repeat(40)}` ? `0x${'e'.repeat(40)}` : address).includes(address))
                    .map(({ address }) => address)
                )
            ]

            const fromTokensItems = uniqueFromTokenAddresses
                .map(address => filteredFromTokens.find(token => token.address === address))
                .filter(token => token)
                .map(({ icon, name, symbol, address }) => ({
                    icon,
                    label: `${name} (${symbol})`,
                    value: address
                }))
            setFromTokenItems(fromTokensItems)
            return true
        } catch(e) {
            console.error(e);
            addToast(`Error while loading from tokens: ${e.message || e}`, { error: true })
            return false
        }
    }, [fromChain, toChain, portfolio.tokens, addToast])

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
                    value: address
                }))
                .sort((a, b) => a.label.localeCompare(b.label))
            setToTokenItems(tokenItems)
            return true
        } catch(e) {
            console.error(e);
            addToast(`Error while loading to tokens: ${e.message || e}`, { error: true })
            return false
        }
    }, [fromChain, toChain, addToast])

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
        try {
            const portfolioToken = getTokenFromPortofolio(fromToken)
            if (!portfolioToken) return
            setLoadingQuotes(true)
            const { decimals } = portfolioToken
            const flatAmount = amount * Math.pow(10, decimals)
            const quotes = await fetchQuotes(fromToken, fromChain, toToken, toChain, flatAmount)
            setQuotes(quotes)
            setLoadingQuotes(false)
        } catch(e) {
            console.error(e);
            addToast(`Error while loading quotes: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => setAmount(0), [fromToken])

    useEffect(() => {
        if (!toChain) return
        const asyncLoad = async () => {
            setLoadingToTokens(true)
            const loaded = await loadToTokens()
            setLoadingToTokens(!loaded)
        }
        asyncLoad()
    }, [toChain, loadToTokens])

    useEffect(() => {
        if (fromChain) loadFromTokens()
    }, [fromChain, loadFromTokens])

    useEffect(() => {
        if (!fromChain) return
        const asyncLoad = async () => {
            setLoading(true)
            const loaded = await loadChains()
            setLoading(!loaded)
        }
        asyncLoad()
    }, [fromChain, loadChains])

    const amountLabel = <div className="amount-label">Available Amount: <span>{ maxAmount }</span></div>

    return (
        <div id="cross-chain" className="panel">
            <div className="title">
                Cross-chain
            </div>
            {
                disabled ? 
                    <div>Not supported on this Network</div>
                    :
                    loading || portfolio.isBalanceLoading ? 
                        <Loading/>
                        :
                        hasNoFunds ?
                            <NoFundsPlaceholder/>
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
                                            onCancel={() => setQuotes(null)}
                                        />
                                        :
                                        <div className="form">
                                            <label>From</label>
                                            <Select searchable defaultValue={fromToken} items={fromTokensItems} onChange={value => setFromToken(value)}/>
                                            <NumberInput min="0" label={amountLabel} value={amount} onInput={value => setAmount(value)} button="MAX" onButtonClick={() => setAmount(maxAmount)}/>
                                            <div className="separator">
                                                <BsArrowDown/>
                                            </div>
                                            <label>To</label>
                                            {
                                                loadingToTokens ? 
                                                    <Loading/>
                                                    :
                                                    <>
                                                        <Select searchable defaultValue={toChain} items={chainsItems} onChange={value => setToChain(value)}/>
                                                        <Select searchable defaultValue={toToken} items={toTokenItems} onChange={value => setToToken(value)}/>
                                                    </>
                                            }
                                            <Button disabled={formDisabled} onClick={getQuotes}>Get Quotes</Button>
                                        </div>
            }
        </div>
    )
}

export default CrossChain