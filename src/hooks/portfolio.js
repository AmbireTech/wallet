import { usePageVisibility } from 'react-page-visibility'
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'
import useHiddenTokens from 'ambire-common/src/hooks/useHiddenTokens'

import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT, ZAPPER_API_KEY, VELCRO_API_ENDPOINT } from 'config'
import { useToasts } from 'hooks/toasts'

const getBalances = (network, protocol, address, provider) =>
    fetchGet(`${provider === 'velcro' ?
        VELCRO_API_ENDPOINT :
        ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${ZAPPER_API_KEY}&newBalances=true`
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
        isCurrNetworkProtocolsLoading,
        cachedBalancesByNetworks,
    } = usePortfolioCommon({
        currentNetwork,
        account,
        useStorage,
        isVisible,
        useToasts,
        getBalances
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
        isCurrNetworkProtocolsLoading,
        cachedBalancesByNetworks,
    }
}
