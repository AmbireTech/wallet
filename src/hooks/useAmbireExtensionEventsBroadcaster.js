import { useEffect } from 'react'

export default function useAmbireExtensionEventsBroadcaster({
                                                              portfolio,
                                                              rewardsData,
                                                              sendMessage,
                                                              sendReply,
                                                              addMessageHandler,
                                                              removeMessageHandler,
                                                              hasPendingSignature,
                                                              hasPendingTransactions
                                                            }) {

  useEffect(() => {
    //event_balanceUpdated
    if (!portfolio.isCurrNetworkBalanceLoading && !rewardsData.isLoading) {
      sendMessage({
        type: 'event_balanceUpdated',
        to: 'contentScript',
        toTabId: 'extension',
        data: {
          balance: portfolio.balance,
          rewards: rewardsData
        }
      }, {ignoreReply: true})
    }
  }, [portfolio.isCurrNetworkBalanceLoading, rewardsData.isLoading, sendMessage])

  useEffect(() => {
    if (!portfolio.isCurrNetworkBalanceLoading) {
      //debugger
      sendMessage({
        type: 'event_assetsUpdated',
        to: 'contentScript',
        toTabId: 'extension',
        data: {
          tokens: portfolio.tokens
        }
      }, {ignoreReply: true})
    }
  }, [portfolio.isCurrNetworkBalanceLoading, sendMessage])

  useEffect(() => {
    sendMessage({
      type: 'event_pendingSignatureStatusUpdated',
      to: 'contentScript',
      toTabId: 'extension',
      data: {
        pending: hasPendingSignature,
      }
    }, {ignoreReply: true})

    if (hasPendingSignature) {
      sendMessage({
        type: 'ambireTabFocus',
        to: 'background',
      }, {ignoreReply: true})
    }

  }, [hasPendingSignature, sendMessage])

  useEffect(() => {
    sendMessage({
      type: 'event_pendingTransactionsStatusUpdated',
      to: 'contentScript',
      toTabId: 'extension',
      data: {
        pending: hasPendingTransactions,
      }
    }, {ignoreReply: true})

    if (hasPendingTransactions) {
      sendMessage({
        type: 'ambireTabFocus',
        to: 'background',
      }, {ignoreReply: true})
    }

  }, [hasPendingTransactions, sendMessage])


  useEffect(() => {
    addMessageHandler({
      type: 'extension_getPendingTransactionsStatus'
    }, (message) => {
      sendReply(message, {
        data: {pending: hasPendingTransactions}
      })
    })

    return () => {
      removeMessageHandler({ type: 'extension_getPendingTransactionsStatus' })
    }
  }, [addMessageHandler, removeMessageHandler, hasPendingTransactions, sendReply])

  useEffect(() => {
    addMessageHandler({
      type: 'extension_getPendingSignatureStatus'
    }, (message) => {
      sendReply(message, {
        data: {pending: hasPendingSignature}
      })
    })

    return () => {
      removeMessageHandler({ type: 'extension_getPendingSignatureStatus' })
    }
  }, [addMessageHandler, removeMessageHandler, hasPendingSignature, sendReply])

}
