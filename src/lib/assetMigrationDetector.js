import { VELCRO_API_ENDPOINT, ZAPPER_API_KEY } from 'config'
import { fetchGet } from 'lib/fetch'

//not sure if I should put this as a lib or in a hook useAssetMigrationDetector()
export default function assetMigrationDetector({ networkId, account }) {
  return fetchGet(`${VELCRO_API_ENDPOINT}/protocols/tokens/balances?addresses[]=${account}&network=${networkId}&api_key=${ZAPPER_API_KEY}&newBalances=true&getz=true`)
    .then(velcroResponse => {

      const signer_ = account.toLowerCase()
      if (!velcroResponse[signer_]) return []
      if (!velcroResponse[signer_].products[0]) return []

      //SKIP NATIVE
      const assets = velcroResponse[signer_].products[0].assets.filter(a => a.tokens[0].address !== '0x0000000000000000000000000000000000000000')

      return assets.map(a => {
        return {
          name: a.tokens[0].symbol,
          address: a.tokens[0].address.toLowerCase(),
          decimals: a.tokens[0].decimals,
          availableBalance: a.tokens[0].balanceRaw,
          balanceUSD: a.tokens[0].balanceUSD
        }
      })
    })
    .catch(err => {
      throw Error('Could not get assets from velcro')
    })
}
