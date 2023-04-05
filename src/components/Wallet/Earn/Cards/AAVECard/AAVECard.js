import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToasts } from 'hooks/toasts'
import AAVELendingPoolAbi from 'ambire-common/src/constants/abis/AAVELendingPoolAbi'
import AAVELendingPoolProviders from 'ambire-common/src/constants/AAVELendingPoolProviders'
import networks from 'consts/networks'
import { getProvider } from 'ambire-common/src/services/provider'
import { ToolTip } from 'components/common'
import AAVE_ICON from 'resources/aave.svg'
import Card from 'components/Wallet/Earn/Card/Card'
import approveToken from 'ambire-common/src/services/approveToken'
import EarnDetailsModal from 'components/Modals/EarnDetailsModal/EarnDetailsModal'
import { MdInfo } from 'react-icons/md'
import { rpcProviders } from 'config/providers'
import { getDefaultTokensItems } from './defaultTokens'

const AAVELendingPool = new Interface(AAVELendingPoolAbi)
const RAY = 10 ** 27
let lendingPoolAddress = null

const AAVECard = ({ networkId, tokens: tokensData, account, addRequest }) => {
  const [tokens] = useState(tokensData)
  const { addToast } = useToasts()

  const currentNetwork = useRef()
  const [isLoading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)
  const [tokensItems, setTokensItems] = useState([])
  const [details, setDetails] = useState([])

  const onTokenSelect = useCallback(
    async (value) => {
      const token = tokensItems.find(({ address }) => address === value)
      if (token) {
        setDetails([
          [
            <ToolTip label="Annual Percentage Rate">
              <div>
                APR&nbsp;
                <MdInfo />
              </div>
            </ToolTip>,
            `${token.apr}%`
          ],
          ['Lock', 'No Lock'],
          ['Type', 'Variable Rate']
        ])
      }
    },
    [tokensItems]
  )

  const networkDetails = networks.find(({ id }) => id === networkId)
  const defaultTokens = useMemo(() => getDefaultTokensItems(networkDetails.id), [networkDetails.id])
  const getToken = (type, address) =>
    tokensItems.filter((token) => token.type === type).find((token) => token.address === address)
  const addRequestTxn = (id, txn, extraGas = 0) =>
    addRequest({
      id,
      dateAdded: new Date().valueOf(),
      type: 'eth_sendTransaction',
      chainId: networkDetails.chainId,
      account,
      txn,
      extraGas
    })

  const onValidate = async (type, tokenAddress, amount) => {
    const validate = async (type, functionData) => {
      const token = getToken(type, tokenAddress)
      const bigNumberHexAmount = ethers.utils
        .parseUnits(amount.toString(), token.decimals)
        .toHexString()
      if (type === 'deposit')
        await approveToken(
          'Aave Pool',
          networkDetails.id,
          account,
          lendingPoolAddress,
          tokenAddress,
          addRequestTxn,
          addToast
        )

      try {
        addRequestTxn(
          `aave_pool_${type}_${Date.now()}`,
          {
            to: lendingPoolAddress,
            value: '0x0',
            data: AAVELendingPool.encodeFunctionData(type, [
              tokenAddress,
              bigNumberHexAmount,
              ...functionData
            ])
          },
          60000
        )
      } catch (e) {
        console.error(e)
        addToast(`Aave ${type} Error: ${e.message || e}`, { error: true })
      }
    }
    if (type === 'Deposit') {
      validate('deposit', [account, 0])
    } else if (type === 'Withdraw') {
      validate('withdraw', [account])
    }
  }

  const loadTokensAPR = useCallback(async (uniqueTokenAddresses, lendingPoolContract) => {
    const aprs = await Promise.all(
      uniqueTokenAddresses.map((address) =>
        lendingPoolContract.getReserveData(address).catch((e) => {
          throw Error(e)
        })
      )
    )
    return Object.fromEntries(
      uniqueTokenAddresses.map((addr, i) => {
        const { liquidityRate } = aprs[i]
        const apr = ((liquidityRate / RAY) * 100).toFixed(2)
        return [addr, apr]
      })
    )
  }, [])

  const loadPool = useCallback(async () => {
    const providerAddress = AAVELendingPoolProviders[networkDetails.id]
    if (!providerAddress) {
      setLoading(false)
      setUnavailable(true)
      return
    }

    try {
      const provider =
        networkDetails.id === 'ethereum'
          ? rpcProviders['ethereum-ambire-earn']
          : getProvider(networkDetails.id)
      const lendingPoolProviderContract = new ethers.Contract(
        providerAddress,
        AAVELendingPool,
        provider
      )
      lendingPoolAddress = await lendingPoolProviderContract.getLendingPool()

      const lendingPoolContract = new ethers.Contract(lendingPoolAddress, AAVELendingPool, provider)
      const reserves = await lendingPoolContract.getReservesList()
      const reservesAddresses = reserves.map((reserve) => reserve.toLowerCase())

      const supportedATokens = defaultTokens
        .filter((t) => t.type === 'withdraw')
        .map((t) => t.address.toLowerCase())

      const supportedTokens = defaultTokens
        .filter((t) => t.type === 'deposit')
        .map((t) => t.address.toLowerCase())

      const withdrawTokens = tokens
        .filter(({ address }) => supportedATokens.includes(address.toLowerCase()))
        .map((token) => ({
          ...token,
          address: defaultTokens.find(
            (t) => t.type === 'withdraw' && t.address.toLowerCase() === token.address.toLowerCase()
          )?.baseTokenAddress,
          type: 'withdraw'
        }))
        .filter((token) => token)
        .sort((a, b) => b.balance - a.balance)

      const depositTokens = tokens
        .filter(({ address }) => supportedTokens.includes(address.toLowerCase()))
        .filter((t) => reservesAddresses.includes(t.address))
        .map((token) => ({
          ...token,
          type: 'deposit'
        }))
        .filter((token) => token)
        .sort((a, b) => b.balance - a.balance)

      const allTokens = [
        ...withdrawTokens,
        ...depositTokens,
        ...defaultTokens.filter(
          ({ type, address }) =>
            type === 'deposit' &&
            !depositTokens
              .map(({ address }) => address.toLowerCase())
              .includes(address.toLowerCase())
        ),
        ...defaultTokens.filter(
          ({ type, baseTokenAddress }) =>
            type === 'withdraw' &&
            !withdrawTokens
              .map(({ address }) => address.toLowerCase())
              .includes(baseTokenAddress.toLowerCase())
        )
      ]

      const uniqueTokenAddresses = [...new Set(allTokens.map(({ address }) => address))]

      const tokensAPR = await loadTokensAPR(uniqueTokenAddresses, lendingPoolContract)
      const tokensItems = allTokens.map((token) => {
        const arp =
          tokensAPR[token.address] === '0.00' && tokensAPR[token.baseTokenAddress]
            ? tokensAPR[token.baseTokenAddress]
            : tokensAPR[token.address]
        return {
          ...token,
          apr: arp,
          icon: token.img || token.tokenImageUrl,
          label: `${token.symbol} (${arp}% APR)`,
          value: token.address
        }
      })
      // Prevent race conditions
      if (currentNetwork.current !== networkDetails.id) return

      setTokensItems(tokensItems)
      setLoading(false)
      setUnavailable(false)
    } catch (e) {
      console.error(e)
      addToast(`Aave load pool error: ${e.message || e}`, { error: true })
    }
  }, [networkDetails.id, defaultTokens, tokens, loadTokensAPR, addToast])

  useEffect(() => {
    const invokeLoadPool = async () => loadPool()
    invokeLoadPool()

    return () => {
      setTokensItems([])
      setLoading(false)
      setUnavailable(false)
    }
  }, [loadPool, unavailable])
  useEffect(() => {
    currentNetwork.current = networkId
    setLoading(true)
  }, [networkId])

  return (
    <Card
      loading={isLoading}
      unavailable={unavailable}
      icon={AAVE_ICON}
      details={details}
      tokensItems={tokensItems}
      onTokenSelect={onTokenSelect}
      onValidate={onValidate}
      moreDetails={
        <EarnDetailsModal
          title="What is Aave"
          description="Aave is an open source and non-custodial DeFi protocol for earning interest on deposits and borrowing assets. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized (perpetually) or undercollateralized (one-block liquidity) fashion."
        />
      }
    />
  )
}

export default AAVECard
