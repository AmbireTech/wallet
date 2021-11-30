import './CrossChain.scss'

import { BsArrowDown } from 'react-icons/bs'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'
import { NumberInput, Button, Select } from '../../../common'
import { fetchChains, fetchFromTokens, fetchQuotes, fetchToTokens } from '../../../../services/movr'
import networks from '../../../../consts/networks'
import { useToasts } from '../../../../hooks/toasts'

const CrossChain = ({ portfolio, network }) => {
    const { addToast } = useToasts()

    const [disabled, setDisabled] = useState(false)
    
    const [fromTokensItems, setFromTokenItems] = useState([])
    const [fromToken, setFromToken] = useState(null)
    const [amount, setAmount] = useState(0)
    const [chainsItems, setChainsItems] = useState([])
    const [toChain, setToChain] = useState(null)
    const [toTokenItems, setToTokenItems] = useState([])
    const [toToken, setToToken] = useState(null)
    
    const fromChain = useMemo(() => network.chainId, [network.chainId])

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
        } catch(e) {
            console.error(e);
            addToast(`Error while loading chains: ${e.message || e}`, { error: true })
        }
    }, [fromChain, addToast])

    const loadTokens = useCallback(async () => {
        if (!fromChain || !toChain) return

        try {
            const fromTokens = await fetchFromTokens(fromChain, toChain)
            const filteredFromTokens = fromTokens.filter(({ name }) => name)
            const uniqueFromTokenAddresses = [
                ...new Set(fromTokens
                    .filter(({ address }) => portfolio.tokens.map(({ address }) => address).includes(address))
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
        } catch(e) {
            console.error(e);
            addToast(`Error while loading tokens: ${e.message || e}`, { error: true })
        }
    }, [portfolio.tokens, fromChain, toChain, addToast])

    const maxAmount = useMemo(() => {
        try {
            const portfolioToken = portfolio.tokens.find(({ address }) => address === fromToken)
            if (!portfolioToken) return 0
            const { balanceRaw, decimals } = portfolioToken
            return ethers.utils.formatUnits(balanceRaw, decimals)
        } catch(e) {
            console.error(e);
            addToast(`Error while formating amount: ${e.message || e}`, { error: true })
        }
    }, [portfolio.tokens, fromToken, addToast])

    const getQuotes = async () => {
        try {
            const portfolioToken = portfolio.tokens.find(({ address }) => address === fromToken)
            if (!portfolioToken) return
            const { decimals } = portfolioToken
            const flatAmount = amount * Math.pow(10, decimals)
            const quotes = await fetchQuotes(fromToken, fromChain, toToken, toChain, flatAmount)
            console.log(quotes);
        } catch(e) {
            console.error(e);
            addToast(`Error while loading quotes: ${e.message || e}`, { error: true })
        }
    }

    useEffect(() => loadTokens(), [toChain, loadTokens])
    useEffect(() => loadChains(), [fromChain, loadChains])

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
                    <div className="form">
                        <label>From</label>
                        <Select searchable defaultValue={fromToken} items={fromTokensItems} onChange={value => setFromToken(value)}/>
                        <NumberInput min="0" label={amountLabel} value={amount} onInput={() => {}} button="MAX" onButtonClick={() => setAmount(maxAmount)}/>
                        <div className="separator">
                            <BsArrowDown/>
                        </div>
                        <label>To</label>
                        <Select searchable defaultValue={toChain} items={chainsItems} onChange={value => setToChain(value)}/>
                        <Select searchable defaultValue={toToken} items={toTokenItems} onChange={value => setToToken(value)}/>
                        <Button onClick={getQuotes}>Get Quotes</Button>
                    </div>
            }
        </div>
    )
}

export default CrossChain