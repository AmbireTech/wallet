import { VELCRO_API_ENDPOINT, ZAPPER_API_KEY } from 'config'
import { fetchGet } from 'lib/fetch'
import TokenList from 'consts/tokenList'
import {ZERO_ADDRESS} from 'consts/specialAddresses'

export default function assetMigrationDetector({ networkId, account }) {
  //First pass
  return fetchGet(`${VELCRO_API_ENDPOINT}/protocols/tokens/balances?addresses[]=${account}&network=${networkId}&api_key=${ZAPPER_API_KEY}&newBalances=true`)
    .then(velcroResponse => {

      const signer_ = account.toLowerCase()
      if (!velcroResponse[signer_]) return []
      if (!velcroResponse[signer_].products[0]) return []

      //FILTER with TokenList
      const filteredAssets = velcroResponse[signer_].products[0].assets
        .filter(a => {
          return TokenList[networkId].find(t => t.address.toLowerCase() === a.tokens[0].address.toLowerCase())
        })

      //Second pass to get real time data
      const customTokens = filteredAssets.map(a => ({
        address: a.tokens[0].address,
        symbol: a.tokens[0].symbol,
        decimals: a.tokens[0].decimals,
      }))
      const urlCustomTokens = `${VELCRO_API_ENDPOINT}/protocols/tokens/balances?addresses[]=${account}&network=${networkId}&api_key=${ZAPPER_API_KEY}&customTokens=${JSON.stringify(customTokens)}`
      return fetchGet(urlCustomTokens)
        .then(finalResponse => {
          const filteredAssets = finalResponse[signer_]?.products[0]?.assets.filter(a => {
            return TokenList[networkId].find(t => t.address.toLowerCase() === a.tokens[0].address.toLowerCase())
          })

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
