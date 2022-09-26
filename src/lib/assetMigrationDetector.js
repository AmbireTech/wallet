import { VELCRO_API_ENDPOINT, ZAPPER_API_KEY } from 'config'
import { fetchGet } from 'lib/fetch'
import {ZERO_ADDRESS} from 'consts/specialAddresses'
import networks from 'consts/networks'

export default function assetMigrationDetector({ networkId, account }) {
  if (networks.find(({id}) => id === networkId)?.relayerlessOnly) return Promise.resolve([])
  if (!account) return Promise.resolve([])// for web accounts

  //First pass
  return fetchGet(`${VELCRO_API_ENDPOINT}/protocols/tokens/balances?addresses[]=${account}&network=${networkId}&api_key=${ZAPPER_API_KEY}&newBalances=true&available_on_coingecko=true`)
    .then(velcroResponse => {

      const signer_ = account.toLowerCase()
      if (!velcroResponse[signer_]) return []
      if (!velcroResponse[signer_].products[0]) return []

      const filteredAssets = velcroResponse[signer_].products[0].assets;

      //Second pass to get real time data
      const customTokens = filteredAssets.map(a => ({
        address: a.tokens[0].address,
        symbol: a.tokens[0].symbol,
        decimals: a.tokens[0].decimals,
      }))
      const urlCustomTokens = `${VELCRO_API_ENDPOINT}/protocols/tokens/balances?addresses[]=${account}&network=${networkId}&api_key=${ZAPPER_API_KEY}&customTokens=${JSON.stringify(customTokens)}&available_on_coingecko=true`
      return fetchGet(urlCustomTokens)
        .then(finalResponse => {
          const filteredAssets = finalResponse[signer_]?.products[0]?.assets

          return filteredAssets.map(a => {
            return {
              name: a.tokens[0].symbol,
              icon: a.tokens[0].tokenImageUrl,
              address: a.tokens[0].address.toLowerCase(),
              native: a.tokens[0].address === ZERO_ADDRESS,
              decimals: a.tokens[0].decimals,
              availableBalance: a.tokens[0].balanceRaw,
              balanceUSD: a.tokens[0].balanceUSD,
              rate: a.tokens[0].balanceUSD / a.tokens[0].balanceRaw
            }
          })
        })
        .catch(err => {
          throw Error('Could not get customToken assets from velcro')
        })
    })
    .catch(err => {
      throw Error('Could not get assets from velcro')
    })
}
