import { usePageVisibility } from 'react-page-visibility'
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'

import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT, VELCRO_API_ENDPOINT, COINGECKO_API_URL } from 'config'
import { useToasts } from 'hooks/toasts'

const getBalances = (network, address, provider, quickResponse) =>
    fetchGet(`${provider === 'velcro' ?
        VELCRO_API_ENDPOINT :
        ZAPPER_API_ENDPOINT}/balance/${address}/${network}?provider=covalent${quickResponse ? '&quick=true': ''}`
    )

const getCoingeckoPrices = (addresses) =>
    fetchGet(`${COINGECKO_API_URL}/simple/price?ids=${addresses}&vs_currencies=usd`
    )

const getCoingeckoAssetPlatforms = () =>
    fetchGet(`${COINGECKO_API_URL}/asset_platforms`
    )

const getCoingeckoPriceByContract = (id, addresses) =>
    fetchGet(`${COINGECKO_API_URL}/coins/${id}/contract/${addresses}`
    )

export default function usePortfolio({ currentNetwork, account, useStorage, relayerURL, useRelayerData, eligibleRequests, requests, selectedAccount }) {
    const isVisible = usePageVisibility()
    
    const {
        balance,
        otherBalances,
        tokens,
        hiddenTokens,
        setHiddenTokens,
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
    } = usePortfolioCommon({
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
        selectedAccount
    })

    return {
        balance,
        otherBalances,
        tokens,
        extraTokens,
        hiddenTokens,
        setHiddenTokens,
        collectibles,
        onAddExtraToken,
        onRemoveExtraToken,
        onAddHiddenToken,
        onRemoveHiddenToken,
        balancesByNetworksLoading,
        isCurrNetworkBalanceLoading,
        loading,
        cache,
    }
}
