import { useCallback, useEffect, useRef, useState } from 'react';

import { ZAPPER_API_KEY } from 'config';
import { fetchGet } from 'lib/fetch';
import { roundFloatingNumber } from 'lib/formatters';
import { ZAPPER_API_ENDPOINT } from 'config'
import supportedProtocols from 'consts/supportedProtocols';
import { useToasts } from 'hooks/toasts'
import { setKnownAddresses, setKnownTokens } from 'lib/humanReadableTransactions';
import { VELCRO_API_ENDPOINT } from 'config'
import { getTokenListBalance, tokenList, checkTokenList } from 'lib/balanceOracle'

const getBalances = (apiKey, network, protocol, address, provider) => fetchGet(`${provider === 'velcro' ? VELCRO_API_ENDPOINT : ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${apiKey}&newBalances=true`)

let hidden, visibilityChange;
if (typeof document.hidden !== 'undefined') {
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}
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
async function supplementTokensDataFromNetwork({ walletAddr, network, tokensData, extraTokens, updateBalance, hiddenTokens }) {
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
    const filteredByHiddenTokensInList = filterByHiddenTokens(tokens, hiddenTokens)
    const filteredByHiddenTokensNotInList = filterByHiddenTokens(tokensNotInList, hiddenTokens)
    // tokensNotInList: call separately to prevent errors from non-erc20 tokens
    // NOTE about err handling: errors are caught for each call in balanceOracle, and we retain the original token entry, which contains the balance
    const calls = paginateArray([...new Set(filteredByHiddenTokensInList)], 100).concat(paginateArray(filteredByHiddenTokensNotInList, 100))

    const tokenBalances = (await Promise.all(calls.map(callTokens => {
        return getTokenListBalance({ walletAddr, tokens: callTokens, network, updateBalance })
    }))).flat().filter(t => {
        return extraTokens.some(et => t.address === et.address) ? true : t.balanceRaw > 0
    })
    return tokenBalances
}

const filterByHiddenTokens = (tokens, hiddenTokens) => {
    return tokens.map(t => {
        return hiddenTokens.find(ht => t.address === ht.address) || { ...t, isHidden: false }
    }).filter(t => !t.isHidden)
}

export default function usePortfolio({ currentNetwork, account, useStorage }) {
    const { addToast } = useToasts()

    const rpcTokensLastUpdated = useRef();
    const currentAccount = useRef();
    const [balancesByNetworksLoading, setBalancesByNetworksLoading] = useState({});    
    const [otherProtocolsByNetworksLoading, setOtherProtocolsByNetworksLoading] = useState({});    

    const [tokensByNetworks, setTokensByNetworks] = useState([])
    // Added unsupported networks (fantom and moonbeam) as default values with empty arrays to prevent crashes
    const [otherProtocolsByNetworks, setOtherProtocolsByNetworks] = useState(supportedProtocols.filter(item => !item.protocols || !item.protocols.length))
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
    const [hiddenTokens, setHiddenTokens] = useStorage({ key: 'hiddenTokens', defaultValue: [] })
    
    // We need to be sure we get the latest balancesByNetworksLoading here
    const areAllNetworksBalancesLoading = useCallback(() => Object.values(balancesByNetworksLoading).every(ntwLoading => ntwLoading), [balancesByNetworksLoading])

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

        if (!updatedTokens.length) {
            setBalancesByNetworksLoading(prev => ({ ...prev, [currentNetwork]: true }))
        }

        const extraTokensAssets = getExtraTokensAssets(account, currentNetwork)
        try {
            const rcpTokenData = await supplementTokensDataFromNetwork({
                walletAddr: account,
                network: currentNetwork,
                tokensData: currentNetworkTokens ? currentNetworkTokens.assets.filter(({ isExtraToken }) => !isExtraToken) : [], // Filter out extraTokens
                extraTokens: extraTokensAssets,
                hiddenTokens
            })

            currentNetworkTokens.assets = rcpTokenData

            setTokensByNetworks(tokensByNetworks => [
                ...tokensByNetworks.filter(({ network }) => network !== currentNetwork),
                currentNetworkTokens
            ])
            
            if (!updatedTokens.length) {
                setBalancesByNetworksLoading(prev => ({ ...prev, [currentNetwork]: false }))
            }

            rpcTokensLastUpdated.current = Date.now()

        } catch(e) {
            console.error('supplementTokensDataFromNetwork failed', e)
            // In case of error set loading indicator to false
            setBalancesByNetworksLoading(prev => ({ ...prev, [currentNetwork]: false }))
        }
    }, [currentNetwork, getExtraTokensAssets, account, hiddenTokens])

    const fetchTokens = useCallback(async (account, currentNetwork = false, showLoadingState, tokensByNetworks) => {
        // Prevent race conditions
        if (currentAccount.current !== account) return

        try {
            const networks = currentNetwork ? [supportedProtocols.find(({ network }) => network === currentNetwork)] : supportedProtocols

            let failedRequests = 0
            const requestsCount = networks.length
            const updatedTokens = (await Promise.all(networks.map(async ({ network, balancesProvider }) => {
            
            // Show loading state only on network change, initial fetch and account change
            if (showLoadingState || !tokensByNetworks.length) {
                setBalancesByNetworksLoading(prev => ({ ...prev, [network]: true }))
            }

                try {
                    const balance = await getBalances(ZAPPER_API_KEY, network, 'tokens', account, balancesProvider)
                    if (!balance) return null

                    const { meta, products, systemInfo } = Object.values(balance)[0]

                    // We should skip the tokens update for the current network,
                    // in the case Velcro returns a cached data, which is more outdated than the already fetched RPC data.
                    // source 1 means Zapper, 2 means Covalent, 2.1 means Covalent from Velcro cache.
                    const isCurrentNetwork = network === currentNetwork
                    const shouldSkipUpdate = isCurrentNetwork && (systemInfo.source > 2 && systemInfo.updateAt < rpcTokensLastUpdated.current)

                    if (shouldSkipUpdate) return null
                    
                    const extraTokensAssets = getExtraTokensAssets(account, network) // Add user added extra token to handle
                    let assets = [
                        ...products.map(({ assets }) => assets.map(({ tokens }) => tokens.map(token => ({
                            ...token,
                            // balanceOracle fixes the number to the 10 decimal places, so here we should also fix it
                            balance: Number(token.balance.toFixed(10)),
                            // balanceOracle rounds to the second decimal places, so here we should also round it
                            balanceUSD: roundFloatingNumber(token.balanceUSD),
                        })))).flat(2),
                        ...extraTokensAssets
                    ]
                    
                    assets = filterByHiddenTokens(assets, hiddenTokens)
                    const updatedNetwork = network

                    setTokensByNetworks(tokensByNetworks => ([
                        ...tokensByNetworks.filter(({ network }) => network !== updatedNetwork),
                        { network, meta, assets }
                    ]))

                    if (showLoadingState || !tokensByNetworks.length) {
                        setBalancesByNetworksLoading(prev => ({ ...prev, [network]: false }))
                    }

                    return {
                        network,
                        meta,
                        assets,
                        systemInfo,
                    }
                } catch(e) {
                    console.error('Balances API error', e)
                    failedRequests++
                }
            }))).filter(data => data)

            updatedTokens.map(networkTokens => {
                return networkTokens.assets = filterByHiddenTokens(networkTokens.assets, hiddenTokens)
            })

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
            addToast(error.message, { error: true })
            // In case of error set all loading indicators to false
            supportedProtocols.map(async network => await setBalancesByNetworksLoading(prev => ({ ...prev, [network]: false })))
            return false
        }
    }, [fetchSupplementTokenData, getExtraTokensAssets, hiddenTokens, addToast])

    const fetchOtherProtocols = useCallback(async (account, currentNetwork = false, otherProtocolsByNetworks) => {
        // Prevent race conditions
        if (currentAccount.current !== account) return

        try {
            const protocols = currentNetwork ? [supportedProtocols.find(({ network }) => network === currentNetwork)] : supportedProtocols

            let failedRequests = 0
            const requestsCount = protocols.reduce((acc, curr) => curr.protocols.length + acc, 0)
            if (requestsCount === 0) return true

            await Promise.all(protocols.map(async ({ network, protocols, nftsProvider }) => {
                const all = (await Promise.all(protocols.map(async protocol => {
                    if (!otherProtocolsByNetworks.length) {
                        setOtherProtocolsByNetworksLoading(prev => ({ ...prev, [network]: true }))
                    }

                    try {
                        const balance = await getBalances(ZAPPER_API_KEY, network, protocol, account, protocol === 'nft' ? nftsProvider : null)
                        let response = Object.values(balance).map(({ products }) => {
                            return products.map(({ label, assets }) =>
                                ({ label, assets: assets.map(({ tokens }) => tokens).flat(1) })
                            )
                        }).flat(2)
                        response = {
                            network,
                            protocols: [...response]
                        }
                        const updatedNetwork = network

                        setOtherProtocolsByNetworks(protocolsByNetworks => ([
                            ...protocolsByNetworks.filter(({ network }) => network !== updatedNetwork),
                            response
                        ]))

                        if (!otherProtocolsByNetworks.length) {
                            setOtherProtocolsByNetworksLoading(prev => ({ ...prev, [network]: false }))
                        }

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
            }))

            lastOtherProcolsRefresh = Date.now()
            if (failedRequests >= requestsCount) throw new Error('Failed to fetch other Protocols from API')
            return true
        } catch (error) {
            lastOtherProcolsRefresh = Date.now()
            console.error(error)
            // In case of error set all loading indicators to false
            supportedProtocols.map(async network => await setOtherProtocolsByNetworksLoading(prev => ({ ...prev, [network]: false })))
            addToast(error.message, { error: true })

            return false
        }
    }, [addToast])

    const refreshTokensIfVisible = useCallback((showLoadingState = false) => {
        if (!account) return
        if (!document[hidden] && !areAllNetworksBalancesLoading()) fetchTokens(account, currentNetwork, showLoadingState, tokensByNetworks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, fetchTokens, currentNetwork])

    const requestOtherProtocolsRefresh = async () => {
        if (!account) return
        if ((Date.now() - lastOtherProcolsRefresh) > 30000 && !otherProtocolsByNetworksLoading[currentNetwork]) await fetchOtherProtocols(account, currentNetwork, otherProtocolsByNetworks)
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
        if (extraTokens.map(({ address }) => address).includes(address)) return addToast(`${name} (${symbol}) is already added to your wallet.`)
        if (Object.values(tokenList).flat(1).map(({ address }) => address).includes(address)) return addToast(`${name} (${symbol}) is already handled by your wallet.`)
        if (tokens.map(({ address }) => address).includes(address)) return addToast(`You already have ${name} (${symbol}) in your wallet.`)

        const updatedExtraTokens = [
            ...extraTokens,
            {
                ...extraToken,
                coingeckoId: null
            }
        ]

        setExtraTokens(updatedExtraTokens)
        addToast(`${name} (${symbol}) token added to your wallet!`)
    }

    const onAddHiddenToken = hiddenToken => {
        const { symbol } = hiddenToken
        const updatedHiddenTokens = [
            ...hiddenTokens,
            {
                ...hiddenToken,
                isHidden: true
            }
        ]

        setHiddenTokens(updatedHiddenTokens)
        addToast(`${symbol} token is hidden from your assets list!`)
    }

    const onRemoveHiddenToken = address => {
        const token = hiddenTokens.find(t => t.address === address)
        if (!token) return addToast(`${address} is not present in your assets list.`)

        const updatedHiddenTokens = hiddenTokens.filter(t => t.address !== address)

        setHiddenTokens(updatedHiddenTokens)
        addToast(`${token.symbol} is shown to your assets list.`)
    }

    const onRemoveExtraToken = address => {
        const token = extraTokens.find(t => t.address === address)
        if (!token) return addToast(`${address} is not present in your wallet.`)

        const updatedExtraTokens = extraTokens.filter(t => t.address !== address)

        setExtraTokens(updatedExtraTokens)
        addToast(`${token.name} (${token.symbol}) was removed from your wallet.`)
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
            await fetchTokens(account, false, true, tokensByNetworks)
        }

        async function loadProtocols() {
            if (!account) return
            await fetchOtherProtocols(account, false, otherProtocolsByNetworks)
        }

        loadBalance()
        loadProtocols()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            addToast(e.message | e, { error: true })
        }
    }, [currentNetwork, tokensByNetworks, otherProtocolsByNetworks, addToast])

    // Reset `rpcTokensLastUpdated` on a network change, because its value is regarding the previous network,
    // and it's not useful for the current network.
    useEffect(() => {
        rpcTokensLastUpdated.current = null
    }, [currentNetwork])

    // Refresh tokens on network change
    useEffect(() => {
        refreshTokensIfVisible(true)
    }, [currentNetwork, refreshTokensIfVisible])

    // Refresh balance every 90s if visible
    // NOTE: this must be synced (a multiple of) supplementing, otherwise we can end up with weird inconsistencies
    useEffect(() => {
        const refreshInterval = setInterval(refreshTokensIfVisible, 90000)
        return () => clearInterval(refreshInterval)
    }, [refreshTokensIfVisible])

    // Refresh balance every 150s if hidden
    useEffect(() => {
        const refreshIfHidden = () => document[hidden] && !areAllNetworksBalancesLoading()
            ? fetchTokens(account, currentNetwork, false, tokensByNetworks)
            : null
        const refreshInterval = setInterval(refreshIfHidden, 150000)
        return () => clearInterval(refreshInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, currentNetwork, fetchTokens])

    // Get supplement tokens data every 20s
    useEffect(() => {
        const refreshInterval = setInterval(() => fetchSupplementTokenData(tokensByNetworks), 20000)
        return () => clearInterval(refreshInterval)
    }, [fetchSupplementTokenData, tokensByNetworks])

    // Refresh balance when window is focused
    useEffect(() => {
        document.addEventListener(visibilityChange, () => {
            refreshTokensIfVisible(false)
        }, false);
        return () => document.removeEventListener(visibilityChange, refreshTokensIfVisible, false);
    }, [refreshTokensIfVisible])

    return {
        balance,
        otherBalances,
        tokens,
        extraTokens,
        hiddenTokens,
        protocols,
        collectibles,
        requestOtherProtocolsRefresh,
        onAddExtraToken,
        onRemoveExtraToken,
        onAddHiddenToken,
        onRemoveHiddenToken,
        balancesByNetworksLoading,
        isCurrNetworkBalanceLoading: balancesByNetworksLoading[currentNetwork],
        areAllNetworksBalancesLoading,
        otherProtocolsByNetworksLoading,
        isCurrNetworkProtocolsLoading: otherProtocolsByNetworksLoading[currentNetwork],
        //updatePortfolio//TODO find a non dirty way to be able to reply to getSafeBalances from the dapps, after the first refresh
    }
}
