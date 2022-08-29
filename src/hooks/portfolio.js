import { usePageVisibility } from 'react-page-visibility'
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'
import useHiddenTokens from 'ambire-common/src/hooks/useHiddenTokens'

import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT, VELCRO_API_ENDPOINT, COINGECKO_API_URL } from 'config'
import { useToasts } from 'hooks/toasts'

const getBalances = (network, address, provider) =>
    fetchGet(`${provider === 'velcro' ?
        VELCRO_API_ENDPOINT :
        ZAPPER_API_ENDPOINT}/balance/${address}/${network}?provider=covalent`
    )

const getOtherNetworksTotals = (network, address, provider) =>
    fetchGet(`${provider === 'velcro' ?
        VELCRO_API_ENDPOINT :
        ZAPPER_API_ENDPOINT}/balance/other_networks/${address}/${network}?provider=covalent`
    )

const getCoingeckoPrices = (addresses) =>
    fetchGet(`${COINGECKO_API_URL}/simple/price?ids=${addresses}&vs_currencies=usd`
    )

export default function usePortfolio({ currentNetwork, account, useStorage }) {
    const isVisible = usePageVisibility()
    
    const {
        balance,
        otherBalances,
        tokens,
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
        getOtherNetworksTotals,
        getCoingeckoPrices
    })

    const {
        onAddHiddenToken,
        onRemoveHiddenToken,
        setHiddenTokens,
        hiddenTokens,
        filteredTokens,
    } = useHiddenTokens({
        useToasts,
        useStorage,
        tokens
    })

    return {
        balance,
        otherBalances,
        tokens: filteredTokens,
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
