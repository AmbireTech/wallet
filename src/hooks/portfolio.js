import { usePageVisibility } from 'react-page-visibility'
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'

import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT, VELCRO_API_ENDPOINT, COINGECKO_API_URL } from 'config'
import { useToasts } from 'hooks/toasts'
import useConstants from './useConstants'
import useDbCacheStorage from './useCacheStorage'
import useLocalCacheStorage from './useLocalCacheStorage'

const useCacheStorage = window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB ? useDbCacheStorage : useLocalCacheStorage
            
const getBalances = (network, address, provider, quickResponse) => {
    if (provider === '' || !provider) return null
    return fetchGet(`${provider === 'velcro' ?
    VELCRO_API_ENDPOINT :
    ZAPPER_API_ENDPOINT}/balance/${address}/${network}${quickResponse ? '?quick=true': ''}`
    )
}

const getCoingeckoPrices = (addresses) =>
    fetchGet(`${COINGECKO_API_URL}/simple/price?ids=${addresses}&vs_currencies=usd`
    )

const getCoingeckoAssetPlatforms = () =>
    fetchGet(`${COINGECKO_API_URL}/asset_platforms`
    )

const getCoingeckoPriceByContract = (id, addresses) =>
    fetchGet(`${COINGECKO_API_URL}/coins/${id}/contract/${addresses}`
    )

const getCoingeckoCoin = (id) => fetchGet(`${COINGECKO_API_URL}/coins/${id}`)

export default function usePortfolio({ currentNetwork, account, useStorage, relayerURL, useRelayerData, eligibleRequests, requests, selectedAccount, sentTxn, accounts }) {
    const isVisible = usePageVisibility()
    
    const {
        balance,
        otherBalances,
        tokens,
        resultTime,
        hiddenTokens,
        onAddHiddenToken,
        onRemoveHiddenToken,
        extraTokens,
        collectibles,
        onAddExtraToken,
        onRemoveExtraToken,
        balancesByNetworksLoading,
        isCurrNetworkBalanceLoading,
        loading,
        cache,
        onAddHiddenCollectible,
        onRemoveHiddenCollectible,
        setHiddenCollectibles,
        hiddenCollectibles
    } = usePortfolioCommon({
        useConstants,
        currentNetwork,
        account,
        useStorage,
        isVisible,
        useToasts,
        getBalances,
        getCoingeckoPrices,
        getCoingeckoPriceByContract,
        getCoingeckoAssetPlatforms,
        getCoingeckoCoin,
        relayerURL,
        useRelayerData,
        eligibleRequests,
        requests,
        selectedAccount,
        sentTxn,
        useCacheStorage,
        accounts
    })

    return {
        balance,
        otherBalances,
        tokens,
        extraTokens,
        hiddenTokens,
        collectibles,
        onAddExtraToken,
        onRemoveExtraToken,
        onAddHiddenToken,
        onRemoveHiddenToken,
        balancesByNetworksLoading,
        isCurrNetworkBalanceLoading,
        loading,
        cache,
        resultTime,
        onAddHiddenCollectible,
        onRemoveHiddenCollectible,
        setHiddenCollectibles,
        hiddenCollectibles
    }
}
