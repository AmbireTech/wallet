import { useCallback, useEffect, useRef, useState } from 'react';

import { ZAPPER_API_KEY } from 'config';
import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT } from 'config'
import supportedProtocols from 'consts/supportedProtocols';
import { setKnownAddresses, setKnownTokens } from 'lib/humanReadableTransactions';
import { VELCRO_API_ENDPOINT } from 'config'
import { getTokenListBalance, tokenList, checkTokenList } from 'lib/balanceOracle'

const getBalances = (apiKey, network, protocol, address, provider) => fetchGet(`${provider === 'velcro' ? VELCRO_API_ENDPOINT : ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

let lastOtherProcolsRefresh = null

// use Balance Oracle
function paginateArray(input, limit) {
    let pages = []
    let from = 0
    for (let i = 1; i <= Math.ceil(input.length / limit); i++) {
        pages.push(input.slice(from, i * limit))
        from += limit
    }
    return pages
}
async function supplementTokensDataFromNetwork({ walletAddr, network, tokensData, extraTokens, updateBalance }) {
    if (!walletAddr || walletAddr==="" || !network || !network === "" ) return []
    if (!tokensData || !tokensData[0]) tokensData = checkTokenList(tokensData || []) //tokensData check and populate for test if undefind
    if (!extraTokens || !extraTokens[0]) extraTokens = checkTokenList(extraTokens || [])  //extraTokens check and populate for test if undefind

    // concat predefined token list with extraTokens list (extraTokens are certainly ERC20)
    const fullTokenList = [ ...new Set(
        tokenList[network] ? tokenList[network].concat(extraTokens) : [...extraTokens]
    )]
    const tokens = fullTokenList.map(t => {
      return tokensData.find(td => td.address === t.address) || t
    })
    const tokensNotInList = tokensData.filter(td => {
      return !tokens.some(t => t.address === td.address)
    })

    // tokensNotInList: call separately to prevent errors from non-erc20 tokens
    // NOTE about err handling: errors are caught for each call in balanceOracle, and we retain the original token entry, which contains the balance
    const calls = paginateArray([...new Set(tokens)], 100).concat(paginateArray(tokensNotInList, 100))

    const tokenBalances = (await Promise.all(calls.map(callTokens => {
        return getTokenListBalance({ walletAddr, tokens: callTokens, network, updateBalance })
    }))).flat().filter(t => {
        return extraTokens.some(et => t.address === et.address) ? true : (parseFloat(t.balance) > 0)
    })
    return tokenBalances
  }


export default function usePortfolio({ currentNetwork, account, useStorage, isVisible, onMessage }) {
    const currentAccount = useRef();
    const [isBalanceLoading, setBalanceLoading] = useState(true);
    const [areProtocolsLoading, setProtocolsLoading] = useState(true);

    const [tokensByNetworks, setTokensByNetworks] = useState([])
    const [otherProtocolsByNetworks, setOtherProtocolsByNetworks] = useState([])

    const [balance, setBalance] = useState({
        total: {
            full: 0,
            truncated: 0,
            decimals: '00'
        },
        tokens: []
    });
    const [otherBalances, setOtherBalances] = useState([]);
    const [tokens, setTokens] = useState([]);
    const [protocols, setProtocols] = useState([]);
    const [collectibles, setCollectibles] = useState([]);
    const [extraTokens, setExtraTokens] = useStorage({ key: 'extraTokens', defaultValue: [] });

    const getExtraTokensAssets = useCallback((account, network) => extraTokens
        .filter(extra => extra.account === account && extra.network === network)
        .map(extraToken => ({
            ...extraToken,
            type: 'base',
            price: 0,
            balanceUSD: 0,
            isExtraToken: true
        }))
    , [extraTokens])

    const fetchSupplementTokenData = useCallback(async (updatedTokens) => {
        const currentNetworkTokens = updatedTokens.find(({ network }) => network === currentNetwork) || { network: currentNetwork, meta: [], assets: [] }

        const extraTokensAssets = getExtraTokensAssets(account, currentNetwork)
        try {
            const rcpTokenData = await supplementTokensDataFromNetwork({
                walletAddr: account,
                network: currentNetwork,
                tokensData: currentNetworkTokens ? currentNetworkTokens.assets.filter(({ isExtraToken }) => !isExtraToken) : [], // Filter out extraTokens
                extraTokens: extraTokensAssets
            })

            currentNetworkTokens.assets = rcpTokenData

            setTokensByNetworks(tokensByNetworks => [
                ...tokensByNetworks.filter(({ network }) => network !== currentNetwork),
                currentNetworkTokens
            ])

            setBalanceLoading(false)
        } catch(e) {
            console.error('supplementTokensDataFromNetwork failed', e)
        }
    }, [getExtraTokensAssets, account, currentNetwork])

    const fetchTokens = useCallback(async (account, currentNetwork = false) => {
        try {
            const networks = currentNetwork ? [supportedProtocols.find(({ network }) => network === currentNetwork)] : supportedProtocols

            let failedRequests = 0
            const requestsCount = networks.length

            const updatedTokens = (await Promise.all(networks.map(async ({ network, balancesProvider }) => {
                try {
                    const balance = await getBalances(ZAPPER_API_KEY, network, 'tokens', account, balancesProvider)
                    if (!balance) return null

                    const { meta, products } = Object.values(balance)[0]

                    const extraTokensAssets = getExtraTokensAssets(account, network) // Add user added extra token to handle
                    const assets = [
                        ...products.map(({ assets }) => assets.map(({ tokens }) => tokens)).flat(2),
                        ...extraTokensAssets
                    ]

                    return {
                        network,
                        meta,
                        assets
                    }
                } catch(e) {
                    console.error('Balances API error', e)
                    failedRequests++
                }
            }))).filter(data => data)
            const updatedNetworks = updatedTokens.map(({ network }) => network)

            // Prevent race conditions
            if (currentAccount.current !== account) return

            setTokensByNetworks(tokensByNetworks => ([
                ...tokensByNetworks.filter(({ network }) => !updatedNetworks.includes(network)),
                ...updatedTokens
            ]))

            if (!currentNetwork) fetchSupplementTokenData(updatedTokens)

            if (failedRequests >= requestsCount) throw new Error('Failed to fetch Tokens from API')
            return true
        } catch (error) {
            console.error(error)
            onMessage(error.message, { error: true })
            return false
        }
    }, [getExtraTokensAssets, fetchSupplementTokenData, onMessage])

    const fetchOtherProtocols = useCallback(async (account, currentNetwork = false) => {
        try {
            const protocols = currentNetwork ? [supportedProtocols.find(({ network }) => network === currentNetwork)] : supportedProtocols

            let failedRequests = 0
            const requestsCount = protocols.reduce((acc, curr) => curr.protocols.length + acc, 0)
            if (requestsCount === 0) return true
            const updatedProtocols = (await Promise.all(protocols.map(async ({ network, protocols, nftsProvider }) => {
                const all = (await Promise.all(protocols.map(async protocol => {
                    try {
                        const balance = await getBalances(ZAPPER_API_KEY, network, protocol, account, protocol === 'nft' ? nftsProvider : null)
                        return balance ? Object.values(balance)[0] : null
                    } catch(e) {
                        console.error('Balances API error', e)
                        failedRequests++
                    }
                }))).filter(data => data).flat()

                return all.length ? {
                    network,
                    protocols: all
                        .map(({ products }) =>
                            products.map(({ label, assets }) =>
                                ({ label, assets: assets.map(({ tokens }) => tokens).flat(1) })
                            )
                        )
                        .flat(2)
                } : null
            }))).filter(data => data)
            const updatedNetworks = updatedProtocols.map(({ network }) => network)

            // Prevent race conditions
            if (currentAccount.current !== account) return

            setOtherProtocolsByNetworks(protocolsByNetworks => ([
                ...protocolsByNetworks.filter(({ network }) => !updatedNetworks.includes(network)),
                ...updatedProtocols
            ]))

            lastOtherProcolsRefresh = Date.now()
            if (failedRequests >= requestsCount) throw new Error('Failed to fetch other Protocols from API')
            return true
        } catch (error) {
            console.error(error)
            onMessage(error.message, { error: true })
            return false
        }
    }, [onMessage])

    const refreshTokensIfVisible = useCallback(() => {
        if (!account) return
        if (isVisible && !isBalanceLoading) fetchTokens(account, currentNetwork)
    }, [isBalanceLoading, account, fetchTokens, currentNetwork, isVisible])

    const requestOtherProtocolsRefresh = async () => {
        if (!account) return
        if ((Date.now() - lastOtherProcolsRefresh) > 30000 && !areProtocolsLoading) await fetchOtherProtocols(account, currentNetwork)
    }

    // Make humanizer 'learn' about new tokens and aliases
    const updateHumanizerData = tokensByNetworks => {
        const tokensList = Object.values(tokensByNetworks).map(({ assets }) => assets).flat(1)
        const knownAliases = tokensList.map(({ address, symbol }) => ({ address, name: symbol}))
        setKnownAddresses(knownAliases)
        setKnownTokens(tokensList)
    }

    const onAddExtraToken = extraToken => {
        const { address, name, symbol } = extraToken
        if (extraTokens.map(({ address }) => address).includes(address)) return onMessage(`${name} (${symbol}) is already added to your wallet.`)
        if (Object.values(tokenList).flat(1).map(({ address }) => address).includes(address)) return onMessage(`${name} (${symbol}) is already handled by your wallet.`)
        if (tokens.map(({ address }) => address).includes(address)) return onMessage(`You already have ${name} (${symbol}) in your wallet.`)

        const updatedExtraTokens = [
            ...extraTokens,
            {
                ...extraToken,
                coingeckoId: null
            }
        ]

        setExtraTokens(updatedExtraTokens)
        onMessage(`${name} (${symbol}) token added to your wallet!`)
    }

    const onRemoveExtraToken = address => {
        const token = extraTokens.find(t => t.address === address)
        if (!token) return onMessage(`${address} is not present in your wallet.`)

        const updatedExtraTokens = extraTokens.filter(t => t.address !== address)

        setExtraTokens(updatedExtraTokens)
        onMessage(`${token.name} (${token.symbol}) was removed from your wallet.`)
    }

    const removeDuplicatedAssets = tokens => {
        const lookup = tokens.reduce((a, e) => {
            a[e.address] = ++a[e.address] || 0
            return a
        }, {})

        // filters by non duplicated objects or takes the one of dup but with a price greater than 0
        tokens = tokens.filter(e => !lookup[e.address] || (lookup[e.address] && e.price))

        return tokens
    }

    // Fetch balances and protocols on account change
    useEffect(() => {
        currentAccount.current = account

        async function loadBalance() {
            if (!account) return
            setBalanceLoading(true)
            if (await fetchTokens(account)) setBalanceLoading(false)
        }

        async function loadProtocols() {
            if (!account) return
            setProtocolsLoading(true)
            if (await fetchOtherProtocols(account)) setProtocolsLoading(false)
        }

        loadBalance()
        loadProtocols()
    }, [account, fetchTokens, fetchOtherProtocols])

    // Update states on network, tokens and ohterProtocols change
    useEffect(() => {
        try {
            const tokens = tokensByNetworks.find(({ network }) => network === currentNetwork)

            if (tokens) {
                tokens.assets = removeDuplicatedAssets(tokens.assets)
                setTokens(tokens.assets)
            }

            const balanceByNetworks = tokensByNetworks.map(({ network, meta, assets }) => {
                const totalUSD = assets.reduce((acc, curr) => acc + curr.balanceUSD, 0)
                const balanceUSD = totalUSD + meta.find(({ label }) => label === 'Debt')?.value
                if (!balanceUSD) return {
                    network,
                    total: {
                        full: 0,
                        truncated: 0,
                        decimals: '00'
                    }
                }

                const [truncated, decimals] = Number(balanceUSD.toString()).toFixed(2).split('.')
                return {
                    network,
                    total: {
                        full: balanceUSD,
                        truncated: Number(truncated).toLocaleString('en-US'),
                        decimals
                    }
                }
            })

            const balance = balanceByNetworks.find(({ network }) => network === currentNetwork)
            if (balance) {
                setBalance(balance)
                setOtherBalances(balanceByNetworks.filter(({ network }) => network !== currentNetwork))
            }

            updateHumanizerData(tokensByNetworks)

            const otherProtocols = otherProtocolsByNetworks.find(({ network }) => network === currentNetwork)
            if (tokens && otherProtocols) {
                setProtocols([
                    {
                        label: 'Tokens',
                        assets: tokens.assets
                    },
                    ...otherProtocols.protocols.filter(({ label }) => label !== 'NFTs')
                ])
                setCollectibles(otherProtocols.protocols.find(({ label }) => label === 'NFTs')?.assets || [])
            }
        } catch(e) {
            console.error(e);
            onMessage(e.message | e, { error: true })
        }
    }, [currentNetwork, tokensByNetworks, otherProtocolsByNetworks, onMessage])

    // Refresh tokens on network change and when window is focused
    useEffect(() => {
        refreshTokensIfVisible()
    }, [currentNetwork, isVisible, refreshTokensIfVisible])

    // Refresh balance every 80s if visible
    // NOTE: this must be synced (a multiple of) supplementing, otherwise we can end up with weird inconsistencies
    useEffect(() => {
        const refreshInterval = setInterval(refreshTokensIfVisible, 90000)
        return () => clearInterval(refreshInterval)
    }, [refreshTokensIfVisible])

    // Refresh balance every 150s if hidden
    useEffect(() => {
        const refreshIfHidden = () => !isVisible && !isBalanceLoading
            ? fetchTokens(account, currentNetwork)
            : null
        const refreshInterval = setInterval(refreshIfHidden, 150000)
        return () => clearInterval(refreshInterval)
    }, [account, currentNetwork, isVisible, isBalanceLoading, fetchTokens])

    // Get supplement tokens data every 20s
    useEffect(() => {
        const refreshInterval = setInterval(() => fetchSupplementTokenData(tokensByNetworks), 20000)
        return () => clearInterval(refreshInterval)
    }, [fetchSupplementTokenData, tokensByNetworks])

    return {
        isBalanceLoading,
        areProtocolsLoading,
        balance,
        otherBalances,
        tokens,
        extraTokens,
        protocols,
        collectibles,
        requestOtherProtocolsRefresh,
        onAddExtraToken,
        onRemoveExtraToken
        //updatePortfolio//TODO find a non dirty way to be able to reply to getSafeBalances from the dapps, after the first refresh
    }
}
