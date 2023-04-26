import { useCallback, useEffect, useState } from 'react'
import { Contract } from 'ethers'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import TesseractVaultABI from 'ambire-common/src/constants/abis/YearnTesseractVaultABI'
import { useToasts } from 'hooks/toasts'
// import { MdInfo } from "react-icons/md"
// import { ToolTip } from "components/common"

import TESSERACT_ICON from 'resources/tesseract.svg'

const POLYGON_SCAN_IMAGES = 'https://polygonscan.com/token/images'
const VAULTS = [
  [
    'tvUSDC',
    '0x57bDbb788d0F39aEAbe66774436c19196653C3F2',
    `${POLYGON_SCAN_IMAGES}/centre-usdc_32.png`
  ],
  ['tvDAI', '0x4c8C6379b7cd039C892ab179846CD30a1A52b125', `${POLYGON_SCAN_IMAGES}/mcdDai_32.png`],
  ['tvWBTC', '0x6962785c731e812073948a1f5E181cf83274D7c6', `${POLYGON_SCAN_IMAGES}/wBTC_32.png`],
  ['tvWETH', '0x3d44F03a04b08863cc8825384f834dfb97466b9B', `${POLYGON_SCAN_IMAGES}/wETH_32.png`],
  ['tvWMATIC', '0xE11678341625cD88Bb25544e39B2c62CeDcC83f1', `${POLYGON_SCAN_IMAGES}/wMatic_32.png`]
]

const TESR_API_ENDPOINT = 'https://prom.tesr.finance/api/v1'

const useTesseract = ({ tokens, provider, networkId, currentNetwork }) => {
  const { addToast } = useToasts()

  const [vaults, setVaults] = useState([])
  const [tokensItems, setTokensItems] = useState([])
  const [details, setDetails] = useState([])

  const toTokensItems = useCallback(
    (type, vaults) => {
      return vaults.map(({ vaultAddress, token, tToken, icon, apy }) => {
        const { address, symbol, decimals } = type === 'deposit' ? token : tToken
        const portfolioToken = tokens.find((t) => t.address.toLowerCase() === address.toLowerCase())
        return {
          type,
          vaultAddress,
          tokenAddress: address,
          symbol,
          decimals,
          icon,
          apy,
          label: `${symbol} (${apy}% APY)`,
          value: vaultAddress,
          balance: portfolioToken ? portfolioToken.balance : 0,
          balanceRaw: portfolioToken ? portfolioToken.balanceRaw : '0'
        }
      })
    },
    [tokens]
  )

  const fetchVaultAPY = useCallback(
    async (ticker) => {
      try {
        const response = await fetch(
          `${TESR_API_ENDPOINT}/query?query=deriv(price{network="matic",ticker="${ticker}",version="0.4.3.1"}[10d])*60*60*24*365`
        )
        const { data, status } = await response.json()
        if (!data || status !== 'success' || !data.result.length) return 0
        return (data.result[0]?.value[1] * 100).toFixed(2)
      } catch (e) {
        console.error(e)
        addToast(`Failed to fetch ${ticker} Vault APY`, { error: true })
      }
    },
    [addToast]
  )

  const loadVaults = useCallback(async () => {
    const vaults = (
      await Promise.all(
        VAULTS.map(async ([ticker, address, icon]) => {
          try {
            const tesseractVaultContract = new Contract(address, TesseractVaultABI, provider)
            const tokenAddress = await tesseractVaultContract.token()

            const tokenContract = new Contract(tokenAddress, ERC20ABI, provider)
            const [symbol, decimals] = await Promise.all([
              await tokenContract.symbol(),
              await tokenContract.decimals()
            ])

            const apy = await fetchVaultAPY(ticker)

            return {
              vaultAddress: address,
              token: {
                address: tokenAddress,
                decimals,
                symbol
              },
              tToken: {
                address,
                decimals,
                symbol: `tv${symbol}`
              },
              icon,
              apy
            }
          } catch (e) {
            console.error(e)
            addToast(`Fetch Tesseract Vaults: ${e.message}` || e, { error: true })
            return null
          }
        })
      )
    ).filter((v) => v)

    if (networkId !== currentNetwork.current) return
    setVaults(vaults)
  }, [networkId, currentNetwork, fetchVaultAPY, provider, addToast])

  const onTokenSelect = useCallback(
    (address) => {
      const selectedToken = tokensItems.find((t) => t.tokenAddress === address)
      if (selectedToken)
        setDetails([
          <div className="warning-msg">
            Tesseract is closing. You will still be able to withdraw your funds indefinitely, but
            there will be no more earning strategies.&nbsp;
            <a
              href="https://medium.com/@tesseract_fi/the-omega-of-tesseract-finance-36d6a75d7310"
              target="_blank"
              rel="noreferrer noopener"
            >
              Learn more.
            </a>
          </div>
        ])
    },
    [tokensItems]
  )

  useEffect(() => {
    const depositTokenItems = toTokensItems('deposit', vaults)
    const withdrawTokenItems = toTokensItems('withdraw', vaults)

    setTokensItems([...depositTokenItems, ...withdrawTokenItems])

    return () => setTokensItems([])
  }, [vaults, toTokensItems])

  return {
    icon: TESSERACT_ICON,
    loadVaults,
    tokensItems,
    details,
    onTokenSelect
  }
}

export default useTesseract
