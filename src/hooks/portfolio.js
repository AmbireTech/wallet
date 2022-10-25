import { usePageVisibility } from 'react-page-visibility'
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'

import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT, VELCRO_API_ENDPOINT, COINGECKO_API_URL } from 'config'
import { useToasts } from 'hooks/toasts'
import useConstants from './useConstants'

const getBalances = (network, address, provider, quickResponse) => {
    if (provider === '' || !provider) return null
    return fetchGet(`${provider === 'velcro' ?
    VELCRO_API_ENDPOINT :
    ZAPPER_API_ENDPOINT}/balance/${address}/${network}?provider=covalent${quickResponse ? '&quick=true': ''}`
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

export default function usePortfolio({ currentNetwork, account, useStorage, relayerURL, useRelayerData, eligibleRequests, requests, selectedAccount, sentTxn }) {
    const isVisible = usePageVisibility()
    
    const {
        balance,
        otherBalances,
        tokens,
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
        relayerURL,
        useRelayerData,
        eligibleRequests,
        requests,
        selectedAccount,
        sentTxn
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
        onAddHiddenCollectible,
        onRemoveHiddenCollectible,
        setHiddenCollectibles,
        hiddenCollectibles
    }
}
