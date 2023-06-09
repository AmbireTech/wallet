import { rpcProviders } from 'config/providers'
import { BigNumber, utils, Contract } from 'ethers'
import { useEffect, useState, useCallback } from 'react'
import useConstants from './useConstants'

const ZERO = BigNumber.from(0)
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const PRECISION = 1_000_000_000_000
const POOL_SHARES_TOKEN_DECIMALS_MUL = '1000000000000000000'
const STAKING_POOL_EVENT_TYPES = {
  enter: 'enter',
  leave: 'leave',
  burn: 'burn',
  withdraw: 'withdraw',
  rageLeave: 'rageLeave',
  shareTokensTransferIn: 'shareTokensTransferIn',
  shareTokensTransferOut: 'shareTokensTransferOut'
}

const useAmbireEarnDetails = ({ accountId, addresses, tokenLabel }) => {
  const ethProvider = rpcProviders['ethereum-ambire-earn']
  const { getAdexToStakingTransfersLogs } = useConstants()
  const WALLET_ADDR = addresses.stakingTokenAddress
  const [details, setDetails] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const getStats = useCallback(
    async (addresses, tokenLabel) => {
      const xWalletContract = new Contract(
        addresses.stakingTokenAddress,
        addresses.stakingPoolAbi,
        ethProvider
      )
      const walletContract = new Contract(addresses.tokenAddress, addresses.tokenAbi, ethProvider)
      const fromBlock = 0
      const fromBlockHardcoded = tokenLabel === 'ADX' ? 0xe64fe2 : 0
      const [
        shareValue,
        sharesTotalSupply,
        balanceShares,
        lockedShares,
        allEnterWalletTransferLogs, // If ADX selected, 0xe64fe2 last block from prefetched data
        leaveLogs,
        withdrawLogs,
        rageLeaveLogs,
        sharesTokensTransfersInLogs,
        sharesTokensTransfersOutLogs
      ] = await Promise.all([
        xWalletContract.shareValue(),
        xWalletContract.totalSupply(),
        xWalletContract.balanceOf(accountId),
        xWalletContract.lockedShares(accountId),
        ethProvider.getLogs({
          fromBlock: fromBlockHardcoded,
          ...walletContract.filters.Transfer(null, WALLET_ADDR, null)
        }),
        ethProvider.getLogs({
          fromBlock,
          ...xWalletContract.filters.LogLeave(accountId, null, null, null)
        }),
        ethProvider.getLogs({
          fromBlock,
          ...xWalletContract.filters.LogWithdraw(accountId, null, null, null, null)
        }),
        ethProvider.getLogs({
          fromBlock,
          ...xWalletContract.filters.LogRageLeave(accountId, null, null, null)
        }),
        ethProvider.getLogs({
          fromBlock,
          ...xWalletContract.filters.Transfer(null, accountId, null)
        }),
        ethProvider.getLogs({
          fromBlock,
          ...xWalletContract.filters.Transfer(accountId, null, null)
        })
      ])

      const userShare = sharesTotalSupply.isZero()
        ? ZERO
        : balanceShares.mul(PRECISION).div(sharesTotalSupply).toNumber() / PRECISION

      const adexToStakingTransfersLogs = await getAdexToStakingTransfersLogs()
      const enterWalletTokensByTxHash = (
        tokenLabel === 'ADX' && adexToStakingTransfersLogs ? adexToStakingTransfersLogs.result : []
      )
        .concat(allEnterWalletTransferLogs)
        .reduce((byHash, log) => {
          byHash[log.transactionHash] = log
          return byHash
        }, {})

      const sharesTokensTransfersIn = sharesTokensTransfersInLogs.map((log) => {
        const parsedLog = xWalletContract.interface.parseLog(log)

        const {
          from, // [0]
          amount // [2]
        } = parsedLog.args

        return {
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          shares: amount,
          type:
            from === ZERO_ADDR
              ? STAKING_POOL_EVENT_TYPES.enter
              : STAKING_POOL_EVENT_TYPES.shareTokensTransferIn,
          from
        }
      })

      // Only out txns as we have logs for RageLEave and Withdraw and they only burns shares
      // TODO: detect innerBurn transactions to ZERO_ADDR (burned by the user itself)
      const sharesTokensTransfersOut = sharesTokensTransfersOutLogs
        .map((log) => {
          const parsedLog = xWalletContract.interface.parseLog(log)

          const {
            to, // [1]
            amount // [2]
          } = parsedLog.args

          return {
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            shares: amount,
            type: STAKING_POOL_EVENT_TYPES.shareTokensTransferOut,
            to
          }
        })
        .filter((x) => x.to !== ZERO_ADDR)

      const { shareTokensEnterMintByHash, shareTokensTransfersInByTxHash } =
        sharesTokensTransfersIn.reduce(
          (txns, event) => {
            if (event.type === STAKING_POOL_EVENT_TYPES.enter) {
              txns.shareTokensEnterMintByHash[event.transactionHash] = event
            }

            if (event.type === STAKING_POOL_EVENT_TYPES.shareTokensTransferIn) {
              txns.shareTokensTransfersInByTxHash[event.transactionHash] = event
            }

            return txns
          },
          {
            shareTokensEnterMintByHash: {},
            shareTokensTransfersInByTxHash: {}
          }
        )

      const sharesTokensTransfersInFromExternal = Object.values(shareTokensTransfersInByTxHash)

      const userEnters = Object.values(shareTokensEnterMintByHash)
        .map((sharesMintEvent) => {
          const adexTokenTransfersLog = enterWalletTokensByTxHash[sharesMintEvent.transactionHash]

          if (adexTokenTransfersLog) {
            const parsedWalletLog = walletContract.interface.parseLog(adexTokenTransfersLog)

            return {
              transactionHash: sharesMintEvent.transactionHash,
              type: STAKING_POOL_EVENT_TYPES.enter,
              shares: sharesMintEvent.shares,
              walletAmount:
                tokenLabel === 'ADX' ? parsedWalletLog.args.value : parsedWalletLog.args.amount, // [2]
              from: parsedWalletLog.args.from,
              blockNumber: sharesMintEvent.blockNumber
            }
          }
          return null
        })
        .filter((x) => !!x)

      const userWithdraws = withdrawLogs.map((log) => {
        const parsedWithdrawLog = xWalletContract.interface.parseLog(log)
        const { shares, unlocksAt, maxTokens, receivedTokens } = parsedWithdrawLog.args

        return {
          transactionHash: log.transactionHash,
          type: STAKING_POOL_EVENT_TYPES.withdraw,
          shares, // [1]
          unlocksAt, // [2]
          maxTokens, // [3]
          receivedTokens, // [4]
          blockNumber: log.blockNumber
        }
      })

      const userRageLeaves = rageLeaveLogs.map((log) => {
        const parsedRageLeaveLog = xWalletContract.interface.parseLog(log)

        const { shares, maxTokens, receivedTokens } = parsedRageLeaveLog.args

        return {
          transactionHash: log.transactionHash,
          type: STAKING_POOL_EVENT_TYPES.rageLeave,
          shares, // [1]
          maxTokens, // [2]
          receivedTokens,
          walletAmount: receivedTokens, // [3]
          blockNumber: log.blockNumber
        }
      })

      const now = new Date() / 1000

      const userLeaves = await Promise.all(
        leaveLogs.map(async (log) => {
          const parsedLog = xWalletContract.interface.parseLog(log)

          const { shares, unlocksAt, maxTokens } = parsedLog.args

          const withdrawTx = userWithdraws.find(
            (event) =>
              event.unlocksAt.toString() === unlocksAt.toString() &&
              event.shares.toString() === shares.toString() &&
              event.maxTokens.toString() === maxTokens.toString()
          )

          const walletValue = sharesTotalSupply.isZero()
            ? ZERO // maxTokens
            : await xWalletContract.unbondingCommitmentWorth(accountId, shares, unlocksAt)

          return {
            transactionHash: log.transactionHash,
            type: STAKING_POOL_EVENT_TYPES.leave,
            shares, // [1]
            unlocksAt, // [2]
            maxTokens, // [3]
            walletValue,
            canWithdraw: unlocksAt < now && !withdrawTx,
            blockNumber: log.blockNumber,
            withdrawTx
          }
        })
      )

      const leavesPendingToUnlock = [...userLeaves].filter((event) => event.unlocksAt > now)

      const leavesReadyToWithdraw = [...userLeaves].filter(
        (event) => event.unlocksAt < now && !event.withdrawTx
      )

      const leavesPendingToUnlockTotalMax = leavesPendingToUnlock.reduce(
        (a, b) => a.add(b.maxTokens),
        ZERO
      )

      const leavesPendingToUnlockTotalWallet = leavesPendingToUnlock.reduce(
        (a, b) => a.add(b.walletValue),
        ZERO
      )

      const leavesReadyToWithdrawTotalMax = leavesReadyToWithdraw.reduce(
        (a, b) => a.add(b.maxTokens),
        ZERO
      )

      const leavesReadyToWithdrawTotalWallet = leavesReadyToWithdraw.reduce(
        (a, b) => a.add(b.walletValue),
        ZERO
      )

      let leavePendingToUnlockOrReadyToWithdraw = null
      if (leavesReadyToWithdraw.length)
        leavePendingToUnlockOrReadyToWithdraw = leavesReadyToWithdraw[0]
      else if (leavesPendingToUnlock.length)
        leavePendingToUnlockOrReadyToWithdraw = leavesPendingToUnlock[0]
      const [latestLog] = leaveLogs.sort((a, b) => b.blockNumber - a.blockNumber)
      let remainingTime
      if (leavePendingToUnlockOrReadyToWithdraw && latestLog) {
        const { unlocksAt } = leavePendingToUnlockOrReadyToWithdraw
        remainingTime = unlocksAt.toString() * 1000 - Date.now()
        if (remainingTime <= 0) remainingTime = 0
      } else {
        remainingTime = null
      }

      if (sharesTokensTransfersOut.length || sharesTokensTransfersInFromExternal.length) {
        const fromBlock = Math.min(
          sharesTokensTransfersOut[0]
            ? sharesTokensTransfersOut[0].blockNumber
            : Number.MAX_SAFE_INTEGER,
          sharesTokensTransfersInFromExternal[0]
            ? sharesTokensTransfersInFromExternal[0].blockNumber
            : Number.MAX_SAFE_INTEGER
        )

        const [
          allLeaveLogs,
          allWithdrawLogs,
          allRageLeaveLogs,
          allEnterSharesTokensTransfersInLogs
        ] = await Promise.all([
          ethProvider.getLogs({
            fromBlock,
            ...xWalletContract.filters.LogLeave(null, null, null, null)
          }),
          ethProvider.getLogs({
            fromBlock,
            ...xWalletContract.filters.LogWithdraw(null, null, null, null, null)
          }),
          ethProvider.getLogs({
            fromBlock,
            ...xWalletContract.filters.LogRageLeave(null, null, null, null)
          }),
          ethProvider.getLogs({
            fromBlock,
            ...xWalletContract.filters.Transfer(ZERO_ADDR, null, null)
          })
        ])

        const allEnters = allEnterSharesTokensTransfersInLogs
          .map((sharesMintEvent) => {
            const walletTokenTransfersLog =
              enterWalletTokensByTxHash[sharesMintEvent.transactionHash]

            if (walletTokenTransfersLog) {
              const parsedLog = walletContract.interface.parseLog(walletTokenTransfersLog)
              const amount = tokenLabel === 'ADX' ? parsedLog.args.value : parsedLog.args.amount
              const { amount: shares } = xWalletContract.interface.parseLog(sharesMintEvent).args

              return {
                blockNumber: sharesMintEvent.blockNumber,
                shareValue: shares.isZero()
                  ? ZERO
                  : amount.mul(POOL_SHARES_TOKEN_DECIMALS_MUL).div(shares)
              }
            }
            return null
          })
          .filter((x) => !!x)

        const allWithdraws = allWithdrawLogs.map((log) => {
          const parsedWithdrawLog = xWalletContract.interface.parseLog(log)
          const { shares, maxTokens } = parsedWithdrawLog.args

          return {
            blockNumber: log.blockNumber,
            shareValue: shares.isZero()
              ? ZERO
              : maxTokens.mul(POOL_SHARES_TOKEN_DECIMALS_MUL).div(shares)
          }
        })

        const allRageLeaves = allRageLeaveLogs.map((log) => {
          const parsedRageLeaveLog = xWalletContract.interface.parseLog(log)

          const { shares, maxTokens } = parsedRageLeaveLog.args

          return {
            shareValue: shares.isZero()
              ? ZERO
              : maxTokens.mul(POOL_SHARES_TOKEN_DECIMALS_MUL).div(shares),
            blockNumber: log.blockNumber
          }
        })

        const allLeaves = allLeaveLogs.map((log) => {
          const parsedLog = xWalletContract.interface.parseLog(log)
          const { shares, maxTokens } = parsedLog.args
          return {
            blockNumber: log.blockNumber,
            shareValue: shares.isZero()
              ? ZERO
              : maxTokens.mul(POOL_SHARES_TOKEN_DECIMALS_MUL).div(shares)
          }
        })

        const allLogs = allEnters
          .concat(allWithdraws)
          .concat(allLeaves)
          .concat(allRageLeaves)
          .sort((a, b) => a.blockNumber - b.blockNumber)

        const withWalletAmount = (events) =>
          events.forEach((transferLog, i) => {
            const nextLog = allLogs.find((log) => log.blockNumber >= transferLog.blockNumber) || {}

            const bestShareValue = nextLog.shareValue || shareValue

            // approximate share value
            events[i].shareValue = bestShareValue
            events[i].walletAmount = transferLog.shares
              .mul(bestShareValue)
              .div(POOL_SHARES_TOKEN_DECIMALS_MUL)
          })

        withWalletAmount(sharesTokensTransfersOut)
        withWalletAmount(sharesTokensTransfersInFromExternal)
      }

      const totalSharesOutTransfers = sharesTokensTransfersOut.reduce(
        (a, b) => a.add(b.shares),
        ZERO
      )

      const totalSharesOutTransfersWalletValue = sharesTokensTransfersOut.reduce(
        (a, b) => a.add(b.walletAmount),
        ZERO
      )

      const totalSharesInTransfers = sharesTokensTransfersInFromExternal.reduce(
        (a, b) => a.add(b.shares),
        ZERO
      )

      const totalSharesInTransfersWalletValue = sharesTokensTransfersInFromExternal.reduce(
        (a, b) => a.add(b.walletAmount),
        ZERO
      )

      const depositsWalletTotal = userEnters.reduce((a, b) => a.add(b.walletAmount), ZERO)

      // Incl received + distributed to other staker. Used for calc reward because the were actually earned
      const rageLeavesWithdrawnWalletTotal = userRageLeaves.reduce(
        (a, b) => a.add(b.maxTokens),
        ZERO
      )

      const rageLeavesReceivedWalletTotal = userRageLeaves.reduce(
        (a, b) => a.add(b.receivedTokens),
        ZERO
      )

      const withdrawsWalletTotal = userWithdraws.reduce((a, b) => a.add(b.receivedTokens), ZERO)

      const totalLockedSharesCheck = [...userLeaves]
        .filter((x) => !x.withdrawTx)
        .reduce((a, b) => a.add(b.shares), ZERO)

      if (!totalLockedSharesCheck.eq(lockedShares)) {
        console.error(
          'locked shares different than check sum, user balance can be incorrect',
          'lockedShares:',
          lockedShares.toString(),
          'totalLockedSharesCheck:',
          totalLockedSharesCheck.toString()
        )
      }

      const balanceSharesAvailable = balanceShares.sub(lockedShares).lt(ZERO)
        ? ZERO
        : balanceShares.sub(lockedShares)

      const currentBalanceWalletAvailable = balanceSharesAvailable
        .mul(shareValue)
        .div(POOL_SHARES_TOKEN_DECIMALS_MUL)

      // NOTE: used to calc actual balance in Wallet + rewards
      const currentBalanceWallet = balanceShares.mul(shareValue).div(POOL_SHARES_TOKEN_DECIMALS_MUL)

      const currentBalanceSharesWalletValue = balanceShares
        .mul(shareValue)
        .div(POOL_SHARES_TOKEN_DECIMALS_MUL)

      const hasInsufficentBalanceForUnbondCommitments = balanceShares.lt(lockedShares)
      const insufficientSharesAmoutForCurrentUnbonds = hasInsufficentBalanceForUnbondCommitments
        ? lockedShares.sub(balanceShares)
        : ZERO

      // NOTE: Used for rage leave because shareValue is can be different than in unbondCommitments
      const currentBalanceWalletAtCurrentShareValue = currentBalanceWalletAvailable

      // Enter, transfers in
      const totalInTokenValue = depositsWalletTotal.add(totalSharesInTransfersWalletValue)

      // Withdraws, Transfers out, rage leaves
      const totalOutTokenValue = withdrawsWalletTotal
        .add(totalSharesOutTransfersWalletValue)
        .add(rageLeavesWithdrawnWalletTotal)

      const totalRewards = currentBalanceWallet.add(totalOutTokenValue).sub(totalInTokenValue)

      const hasActiveUnbondCommitments = !![...userLeaves].filter((x) => !x.withdrawTx).length

      const stakings = userEnters
        .concat(userLeaves)
        .concat(userWithdraws)
        .concat(userRageLeaves)
        .concat(sharesTokensTransfersInFromExternal)
        .concat(sharesTokensTransfersOut)
        .sort((a, b) => a.blockNumber - b.blockNumber)

      const withTimestamp = await Promise.all(
        stakings.map(async (stakingEvent) => {
          const { timestamp } = await ethProvider.getBlock(stakingEvent.blockNumber)
          return {
            ...stakingEvent,
            timestamp: timestamp * 1000
          }
        })
      )

      const stats = {
        // ...poolData,
        balanceShares,
        balanceSharesAvailable,
        currentBalanceWallet,
        currentBalanceWalletAvailable,
        currentBalanceWalletAtCurrentShareValue,
        currentBalanceSharesWalletValue,
        hasInsufficentBalanceForUnbondCommitments,
        insufficientSharesAmoutForCurrentUnbonds,
        totalRewards,
        totalSharesOutTransfersWalletValue,
        totalSharesInTransfersWalletValue,
        stakings: withTimestamp,
        userLeaves,
        depositsWalletTotal,
        withdrawsWalletTotal,
        leavesPendingToUnlockTotalMax,
        leavesReadyToWithdrawTotalMax,
        leavesPendingToUnlockTotalWallet,
        leavesReadyToWithdrawTotalWallet,
        hasActiveUnbondCommitments,
        loaded: true,
        userDataLoaded: true,
        userShare,
        remainingTime,
        totalSharesOutTransfers,
        totalSharesInTransfers,
        rageLeavesReceivedWalletTotal,
        rageLeavesWithdrawnWalletTotal,
        totalInTokenValue,
        totalOutTokenValue
      }

      return {
        currentBalanceWalletAtCurrentShareValue: utils.formatUnits(
          stats.currentBalanceWalletAtCurrentShareValue.toString(),
          18
        ),
        balance: utils.formatUnits(stats.currentBalanceWallet.toString(), 18),
        poolShare: stats.userShare,
        allTimeRewards: utils.formatUnits(stats.totalRewards.toString(), 18),
        totalDeposit: utils.formatUnits(stats.depositsWalletTotal.toString(), 18),
        totalWithdraws: utils.formatUnits(stats.withdrawsWalletTotal.toString(), 18),
        pendingToUnlock: utils.formatUnits(stats.leavesPendingToUnlockTotalWallet.toString(), 18),
        readyToWithdraw: utils.formatUnits(stats.leavesReadyToWithdrawTotalWallet.toString(), 18),
        totalInTokenValue: utils.formatUnits(stats.totalInTokenValue.toString(), 18),
        totalOutTokenValue: utils.formatUnits(stats.totalOutTokenValue.toString(), 18),
        rageLeavesReceivedWalletTotal: utils.formatUnits(
          stats.rageLeavesReceivedWalletTotal.toString(),
          18
        ),
        rageLeavesWithdrawnWalletTotal: utils.formatUnits(
          stats.rageLeavesWithdrawnWalletTotal.toString(),
          18
        ),
        totalSharesInTransfersWalletValue: utils.formatUnits(
          stats.totalSharesInTransfersWalletValue.toString(),
          18
        ),
        totalSharesOutTransfersWalletValue: utils.formatUnits(
          stats.totalSharesOutTransfersWalletValue.toString(),
          18
        ),
        remainingTime: stats.remainingTime
      }
    },
    [WALLET_ADDR, accountId, getAdexToStakingTransfersLogs, ethProvider]
  )

  useEffect(() => {
    const getData = async (addresses, tokenLabel) => {
      setIsLoading(true)
      try {
        const data = await getStats(addresses, tokenLabel)
        setDetails(data)
        setIsLoading(false)
      } catch (e) {
        console.error(e)
        setIsLoading(false)
      }
    }
    if (!accountId) return
    getData(addresses, tokenLabel)
  }, [accountId, addresses, getStats, setDetails, setIsLoading, tokenLabel])

  return { details, isLoading } || {}
}

export default useAmbireEarnDetails
