import { usePageVisibility } from 'react-page-visibility';
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'

import { ZAPPER_API_KEY } from 'config';
import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT } from 'config'
import { useToasts } from 'hooks/toasts'
import { VELCRO_API_ENDPOINT } from 'config'

const getBalances = (network, protocol, address, provider) =>{
    if (provider === '' || !provider) return null
    return fetchGet(`${provider === 'velcro' ?
    VELCRO_API_ENDPOINT :
    ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${ZAPPER_API_KEY}&newBalances=true`
)
}

export default function usePortfolio({ currentNetwork, account, useStorage }) {
    const isVisible = usePageVisibility()

    const {
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
        isCurrNetworkBalanceLoading,
        areAllNetworksBalancesLoading,
        otherProtocolsByNetworksLoading,
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
        isCurrNetworkBalanceLoading,
        areAllNetworksBalancesLoading,
        otherProtocolsByNetworksLoading,
        isCurrNetworkProtocolsLoading,
        cachedBalancesByNetworks
    }
}
