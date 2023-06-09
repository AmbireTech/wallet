import { VELCRO_API_ENDPOINT } from 'config'
import { fetchGet } from 'lib/fetch'
import { ZERO_ADDRESS } from 'consts/specialAddresses'
import networks from 'consts/networks'

export default function assetMigrationDetector({ networkId, account }) {
  if (networks.find(({ id }) => id === networkId)?.relayerlessOnly) return Promise.resolve([])
  if (!account) return Promise.resolve([]) // for web accounts
  // First pass
  return fetchGet(
    `${VELCRO_API_ENDPOINT}/balance/${account}/${networkId}?newBalances=true&available_on_coingecko=true`
  )
    .then((velcroResponse) => {
      if (!velcroResponse.data) return []
      if (!velcroResponse.data?.tokens) return []

      const filteredAssets = velcroResponse.data?.tokens
      // Second pass to get real time data
      const customTokens = filteredAssets.map((a) => ({
        address: a.address,
        symbol: a.symbol,
        decimals: a.decimals
      }))

      const urlCustomTokens = `${VELCRO_API_ENDPOINT}/balance/${account}/${networkId}?customTokens=${JSON.stringify(
        customTokens
      )}&available_on_coingecko=true`
      return fetchGet(urlCustomTokens)
        .then((finalResponse) => {
          const filteredAssets = finalResponse.data?.tokens
          return filteredAssets.map((a) => {
            return {
              name: a.symbol,
              icon: a.tokenImageUrl,
              address: a.address.toLowerCase(),
              native: a.address === ZERO_ADDRESS,
              decimals: a.decimals,
              availableBalance: a.balanceRaw,
              balanceUSD: a.balanceUSD,
              rate: a.balanceUSD / a.balanceRaw
            }
          })
        })
        .catch((err) => {
          throw Error('Could not get customToken assets from velcro')
        })
    })
    .catch((err) => {
      throw Error('Could not get assets from velcro')
    })
}
