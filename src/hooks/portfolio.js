import { useCallback, useEffect, useRef, useState } from 'react';
import usePortfolioCommon from 'ambire-common/src/hooks/usePortfolio'

import { ZAPPER_API_KEY } from 'config';
import { fetchGet } from 'lib/fetch';
import { ZAPPER_API_ENDPOINT } from 'config'
import { useToasts } from 'hooks/toasts'
import { VELCRO_API_ENDPOINT } from 'config'

const getBalances = (network, protocol, address, provider) =>
    fetchGet(`${provider === 'velcro' ? VELCRO_API_ENDPOINT : ZAPPER_API_ENDPOINT}/protocols/${protocol}/balances?addresses[]=${address}&network=${network}&api_key=${ZAPPER_API_KEY}&newBalances=true`)

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

export default function usePortfolio({ currentNetwork, account, useStorage }) {
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
        loadBalance,
        loadProtocols
      } = usePortfolioCommon({
        currentNetwork,
        account,
        useStorage,
        // TODO: Figure out if this is enough
        isVisible: !hidden,
        useToasts,
        getBalances
      })

    // TODO: Figure out how to implement this
    // Refresh balance when window is focused
    // useEffect(() => {
    //     document.addEventListener(visibilityChange, () => {
    //         refreshTokensIfVisible(false)
    //     }, false);
    //     return () => document.removeEventListener(visibilityChange, refreshTokensIfVisible, false);
    // }, [refreshTokensIfVisible])

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
        //updatePortfolio//TODO find a non dirty way to be able to reply to getSafeBalances from the dapps, after the first refresh
    }
}
