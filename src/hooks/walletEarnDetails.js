import { getProvider } from 'lib/provider'
import { BigNumber, utils, Contract } from 'ethers'

import { useEffect, useState, useCallback } from 'react'

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
    shareTokensTransferOut: 'shareTokensTransferOut',
}

const ethProvider = getProvider('ethereum')

const useWalletEarnDetails = ({accountId, addresses}) => {
    const xWalletContract = useCallback(() => new Contract(addresses.stakingTokenAddress, addresses.stakingPoolInterface, ethProvider), [addresses.stakingPoolInterface, addresses.stakingTokenAddress])
    const walletContract = new Contract(addresses.tokenAddress, addresses.tokenAbi, ethProvider)
    const XWALLET_ADDR = addresses.stakingTokenAddress
    const [details, setDetails] = useState({})
    const [isLoading, setIsLoading] = useState(true)

    const getStats = useCallback(async () => {
        const fromBlock = 0
        const [
            timeToUnbond,
            shareValue,
            sharesTotalSupply,
            balanceShares,
            lockedShares,
            allEnterWalletTransferLogs,
            leaveLogs,
            withdrawLogs,
            rageLeaveLogs,
            sharesTokensTransfersInLogs,
            sharesTokensTransfersOutLogs,
        ] = await Promise.all([
            xWalletContract.timeToUnbond(),
            xWalletContract.shareValue(),
            xWalletContract.totalSupply(),
            xWalletContract.balanceOf(accountId),
            xWalletContract.lockedShares(accountId),
            ethProvider.getLogs({
                fromBlock,
                ...walletContract.filters.Transfer(null, XWALLET_ADDR, null),
            }),
            ethProvider.getLogs({
                fromBlock,
                ...xWalletContract.filters.LogLeave(accountId, null, null, null),
            }),
            ethProvider.getLogs({
                fromBlock,
                ...xWalletContract.filters.LogWithdraw(
                    accountId,
                    null,
                    null,
                    null,
                    null
                ),
            }),
            ethProvider.getLogs({
                fromBlock,
                ...xWalletContract.filters.LogRageLeave(
                    accountId,
                    null,
                    null,
                    null
                ),
            }),
            ethProvider.getLogs({
                fromBlock,
                ...xWalletContract.filters.Transfer(null, accountId, null),
            }),
            ethProvider.getLogs({
                fromBlock,
                ...xWalletContract.filters.Transfer(accountId, null, null),
            }),
        ])
        const [latestLog] = leaveLogs.sort((a, b) => b.blockNumber - a.blockNumber)
        let remainingTime
        if (latestLog) {
            const { timestamp } = await ethProvider.getBlock(latestLog.blockNumber)
            remainingTime = (timeToUnbond.toString() * 1000) - (Date.now() - (timestamp * 1000))
            if (remainingTime <= 0) remainingTime = 0
        } else {
            remainingTime = null
        }
       
        const userShare = sharesTotalSupply.isZero()
            ? ZERO
            : balanceShares.mul(PRECISION).div(sharesTotalSupply).toNumber() /
              PRECISION

        const enterWalletTokensByTxHash = allEnterWalletTransferLogs.reduce(
            (byHash, log) => {
                byHash[log.transactionHash] = log
                return byHash
            },
            {}
        )

        const sharesTokensTransfersIn = sharesTokensTransfersInLogs.map(log => {
            const parsedLog = xWalletContract.interface.parseLog(log)

            const {
                from, // [0]
                amount, // [2]
            } = parsedLog.args

            return {
                transactionHash: log.transactionHash,
                blockNumber: log.blockNumber,
                shares: amount,
                type:
                    from === ZERO_ADDR
                        ? STAKING_POOL_EVENT_TYPES.enter
                        : STAKING_POOL_EVENT_TYPES.shareTokensTransferIn,
                from,
            }
        })

        // Only out txns as we have logs for RageLEave and Withdraw and they only burns shares
        // TODO: detect innerBurn transactions to ZERO_ADDR (burned by the user itself)
        const sharesTokensTransfersOut = sharesTokensTransfersOutLogs
            .map(log => {
                const parsedLog = xWalletContract.interface.parseLog(log)

                const {
                    to, // [1]
                    amount, // [2]
                } = parsedLog.args

                return {
                    transactionHash: log.transactionHash,
                    blockNumber: log.blockNumber,
                    shares: amount,
                    type: STAKING_POOL_EVENT_TYPES.shareTokensTransferOut,
                    to,
                }
            })
            .filter(x => x.to !== ZERO_ADDR)

        const { shareTokensEnterMintByHash, shareTokensTransfersInByTxHash } =
            sharesTokensTransfersIn.reduce(
                (txns, event) => {
                    if (event.type === STAKING_POOL_EVENT_TYPES.enter) {
                        txns.shareTokensEnterMintByHash[event.transactionHash] =
                            event
                    }

                    if (
                        event.type ===
                        STAKING_POOL_EVENT_TYPES.shareTokensTransferIn
                    ) {
                        txns.shareTokensTransfersInByTxHash[
                            event.transactionHash
                        ] = event
                    }

                    return txns
                },
                {
                    shareTokensEnterMintByHash: {},
                    shareTokensTransfersInByTxHash: {},
                }
            )

        const sharesTokensTransfersInFromExternal = Object.values(
            shareTokensTransfersInByTxHash
        )

        const userEnters = Object.values(shareTokensEnterMintByHash)
            .map(sharesMintEvent => {
                const adexTokenTransfersLog =
                    enterWalletTokensByTxHash[sharesMintEvent.transactionHash]

                if (adexTokenTransfersLog) {
                    const parsedWalletLog = walletContract.interface.parseLog(
                        adexTokenTransfersLog
                    )

                    return {
                        transactionHash: sharesMintEvent.transactionHash,
                        type: STAKING_POOL_EVENT_TYPES.enter,
                        shares: sharesMintEvent.shares,
                        walletAmount: parsedWalletLog.args.amount, // [2]
                        from: parsedWalletLog.args.from,
                        blockNumber: sharesMintEvent.blockNumber,
                    }
                } else {
                    return null
                }
            })
            .filter(x => !!x)

        const userWithdraws = withdrawLogs.map(log => {
            const parsedWithdrawLog = xWalletContract.interface.parseLog(log)
            const { shares, unlocksAt, maxTokens, receivedTokens } =
                parsedWithdrawLog.args

            return {
                transactionHash: log.transactionHash,
                type: STAKING_POOL_EVENT_TYPES.withdraw,
                shares, //[1]
                unlocksAt, //[2]
                maxTokens, //[3]
                receivedTokens, //[4]
                blockNumber: log.blockNumber,
            }
        })

        const userRageLeaves = rageLeaveLogs.map(log => {
            const parsedRageLeaveLog = xWalletContract.interface.parseLog(log)

            const { shares, maxTokens, receivedTokens } =
                parsedRageLeaveLog.args

            return {
                transactionHash: log.transactionHash,
                type: STAKING_POOL_EVENT_TYPES.rageLeave,
                shares, //[1]
                maxTokens, //[2]
                receivedTokens,
                walletAmount: receivedTokens, //[3]
                blockNumber: log.blockNumber,
            }
        })

        const now = new Date() / 1000

        const userLeaves = await Promise.all(
            leaveLogs.map(async log => {
                const parsedLog = xWalletContract.interface.parseLog(log)

                const { shares, unlocksAt, maxTokens } = parsedLog.args

                const withdrawTx = userWithdraws.find(
                    event =>
                        event.unlocksAt.toString() === unlocksAt.toString() &&
                        event.shares.toString() === shares.toString() &&
                        event.maxTokens.toString() === maxTokens.toString()
                )

                const walletValue = sharesTotalSupply.isZero()
                    ? ZERO // maxTokens
                    : await xWalletContract.unbondingCommitmentWorth(
                          accountId,
                          shares,
                          unlocksAt
                      )

                return {
                    transactionHash: log.transactionHash,
                    type: STAKING_POOL_EVENT_TYPES.leave,
                    shares, // [1]
                    unlocksAt, //[2]
                    maxTokens, // [3]
                    walletValue,
                    canWithdraw: unlocksAt < now && !withdrawTx,
                    blockNumber: log.blockNumber,
                    withdrawTx,
                }
            })
        )
        
        const leavesPendingToUnlock = [...userLeaves].filter(
            event => event.unlocksAt > now
        )

        const leavesReadyToWithdraw = [...userLeaves].filter(
            event => event.unlocksAt < now && !event.withdrawTx
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

        if (
            sharesTokensTransfersOut.length ||
            sharesTokensTransfersInFromExternal.length
        ) {
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
                allEnterSharesTokensTransfersInLogs,
            ] = await Promise.all([
                ethProvider.getLogs({
                    fromBlock,
                    ...xWalletContract.filters.LogLeave(null, null, null, null),
                }),
                ethProvider.getLogs({
                    fromBlock,
                    ...xWalletContract.filters.LogWithdraw(
                        null,
                        null,
                        null,
                        null,
                        null
                    ),
                }),
                ethProvider.getLogs({
                    fromBlock,
                    ...xWalletContract.filters.LogRageLeave(
                        null,
                        null,
                        null,
                        null
                    ),
                }),
                ethProvider.getLogs({
                    fromBlock,
                    ...xWalletContract.filters.Transfer(ZERO_ADDR, null, null),
                }),
            ])

            const allEnters = allEnterSharesTokensTransfersInLogs
                .map(sharesMintEvent => {
                    const walletTokenTransfersLog =
                        enterWalletTokensByTxHash[
                            sharesMintEvent.transactionHash
                        ]

                    if (walletTokenTransfersLog) {
                        const { value } = walletContract.interface.parseLog(
                            walletTokenTransfersLog
                        ).args
                        const { amount: shares } =
                            xWalletContract.interface.parseLog(
                                sharesMintEvent
                            ).args

                        return {
                            blockNumber: sharesMintEvent.blockNumber,
                            shareValue: shares.isZero()
                                ? ZERO
                                : value
                                      .mul(POOL_SHARES_TOKEN_DECIMALS_MUL)
                                      .div(shares),
                        }
                    } else {
                        return null
                    }
                })
                .filter(x => !!x)

            const allWithdraws = allWithdrawLogs.map(log => {
                const parsedWithdrawLog =
                    xWalletContract.interface.parseLog(log)
                const { shares, maxTokens } = parsedWithdrawLog.args

                return {
                    blockNumber: log.blockNumber,
                    shareValue: maxTokens
                        .mul(POOL_SHARES_TOKEN_DECIMALS_MUL)
                        .div(shares),
                }
            })

            const allRageLeaves = allRageLeaveLogs.map(log => {
                const parsedRageLeaveLog =
                    xWalletContract.interface.parseLog(log)

                const { shares, maxTokens } = parsedRageLeaveLog.args

                return {
                    shareValue: maxTokens
                        .mul(POOL_SHARES_TOKEN_DECIMALS_MUL)
                        .div(shares),
                    blockNumber: log.blockNumber,
                }
            })

            const allLeaves = allLeaveLogs.map(log => {
                const parsedLog = xWalletContract.interface.parseLog(log)
                const { shares, maxTokens } = parsedLog.args
                return {
                    blockNumber: log.blockNumber,
                    shareValue: maxTokens
                        .mul(POOL_SHARES_TOKEN_DECIMALS_MUL)
                        .div(shares),
                }
            })

            const allLogs = allEnters
                .concat(allWithdraws)
                .concat(allLeaves)
                .concat(allRageLeaves)
                .sort((a, b) => a.blockNumber - b.blockNumber)

            const withWalletAmount = events =>
                events.forEach((transferLog, i) => {
                    const nextLog =
                        allLogs.find(
                            log => log.blockNumber >= transferLog.blockNumber
                        ) || {}

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

        const totalSharesOutTransfersWalletValue =
            sharesTokensTransfersOut.reduce(
                (a, b) => a.add(b.walletAmount),
                ZERO
            )

        const totalSharesInTransfersWalletValue =
            sharesTokensTransfersInFromExternal.reduce(
                (a, b) => a.add(b.walletAmount),
                ZERO
            )

        const depositsWalletTotal = userEnters.reduce(
            (a, b) => a.add(b.walletAmount),
            totalSharesInTransfersWalletValue
        )

        const withdrawsWalletTotal = userWithdraws.reduce(
            (a, b) => a.add(b.receivedTokens),
            totalSharesOutTransfersWalletValue
        )

        const lockedSharesWalletValue = [...userLeaves]
            .filter(x => !x.withdrawTx)
            .reduce((a, b) => a.add(b.walletValue), ZERO)

        const totalLockedSharesCheck = [...userLeaves]
            .filter(x => !x.withdrawTx)
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

        const balanceSharesAvailable = balanceShares.sub(lockedShares)

        const currentBalanceWalletAvailable = balanceSharesAvailable
            .mul(shareValue)
            .div(POOL_SHARES_TOKEN_DECIMALS_MUL)

        // NOTE: used to calc actual balance in Wallet + rewards
        const currentBalanceWallet = currentBalanceWalletAvailable.add(
            lockedSharesWalletValue
        )

        const currentBalanceSharesWalletValue = balanceShares
            .mul(shareValue)
            .div(POOL_SHARES_TOKEN_DECIMALS_MUL)

        const hasInsufficentBalanceForUnbondCommitments =
            currentBalanceWalletAvailable.lt(currentBalanceSharesWalletValue)
        const insufficientSharesAmoutForCurrentUnbonds =
            hasInsufficentBalanceForUnbondCommitments
                ? balanceSharesAvailable
                : ZERO

        // NOTE: Used for rage leave because shareValue is can be different than in unbondCommitments
        const lockedSharesWalletAtCurrentShareValue = lockedShares
            .mul(shareValue)
            .div(POOL_SHARES_TOKEN_DECIMALS_MUL)

        const currentBalanceWalletAtCurrentShareValue =
            currentBalanceWalletAvailable.add(
                lockedSharesWalletAtCurrentShareValue
            )

        const totalRewards = currentBalanceWallet // includes leavesPendingToUnlockTotalWallet and  leavesReadyToWithdrawTotalWallet
            .add(withdrawsWalletTotal)
            .sub(depositsWalletTotal)

        const hasActiveUnbondCommitments = !![...userLeaves].filter(
            x => !x.withdrawTx
        ).length

        const stakings = userEnters
            .concat(userLeaves)
            .concat(userWithdraws)
            .concat(userRageLeaves)
            .concat(sharesTokensTransfersInFromExternal)
            .concat(sharesTokensTransfersOut)
            .sort((a, b) => a.blockNumber - b.blockNumber)

        const withTimestamp = await Promise.all(
            stakings.map(async stakingEvent => {
                const { timestamp } = await ethProvider.getBlock(
                    stakingEvent.blockNumber
                )
                return {
                    ...stakingEvent,
                    timestamp: timestamp * 1000,
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
        }

        return {
            balance: utils.formatUnits(
                stats.currentBalanceWallet.toString(),
                18
            ),
            poolShare: stats.userShare,
            allTimeRewards: utils.formatUnits(
                stats.totalRewards.toString(),
                18
            ),
            totalDeposit: utils.formatUnits(
                stats.depositsWalletTotal.toString(),
                18
            ),
            totalWithdraws: utils.formatUnits(
                stats.withdrawsWalletTotal.toString(),
                18
            ),
            pendingToUnlock: utils.formatUnits(
                stats.leavesPendingToUnlockTotalWallet.toString(),
                18
            ),
            readyToWithdraw: utils.formatUnits(
                stats.leavesReadyToWithdrawTotalWallet.toString(),
                18
            ),
            remainingTime: stats.remainingTime,
        }
    }, [XWALLET_ADDR, accountId, walletContract.filters, walletContract.interface, xWalletContract])

    useEffect(() => {
        const getData = async () => {
            setIsLoading(prevState => !prevState)
            try {
                const data = await getStats()
                setDetails(data)
                setIsLoading(prevState => !prevState)
            } catch(e) {
                console.error(e)
                setIsLoading(prevState => !prevState)
            }
        }
        if (!accountId) return
        getData()
    }, [accountId, getStats, setDetails, setIsLoading])

    return { details, isLoading } || {}
}

export default useWalletEarnDetails
