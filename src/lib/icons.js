import { coingeckoNets } from 'ambire-common/src/constants/networks'

const customIcons = {
  '0xb468a1e5596cfbcdf561f21a10490d99b4bb7b68':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jeff_Sessions_with_Elmo_and_Rosita_%28cropped%29.jpg/220px-Jeff_Sessions_with_Elmo_and_Rosita_%28cropped%29.jpg', // TEST Polygon ELMO token,
  '0x88800092ff476844f74dc2fc427974bbee2794ae':
    'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/ambire_logo_white_bg_250x250.png', // Ambire Wallet Token
  '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935':
    'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/xwallet_250x250.png', // xWallet
  '0xb6456b57f03352be48bf101b46c1752a0813491a':
    'https://raw.githubusercontent.com/AmbireTech/adex-brand/master/logos/vaporwave-adex-2.png', // ADX-STAKING
  '0xd9a4cb9dc9296e111c66dfacab8be034ee2e1c2c':
    'https://raw.githubusercontent.com/AmbireTech/adex-brand/master/logos/ADX-loyalty%40256x256.png', // ADX-LOYALTY
  '0xec3b10ce9cabab5dbf49f946a623e294963fbb4e':
    'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/xwallet_250x250.png', // Polygons test xWallet
  '0xe9415e904143e42007865e6864f7f632bd054a08':
    'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png', // Polygons test Wallet
  '0xade00c28244d5ce17d72e40330b1c318cd12b7c3':
    'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/official-logos/Ambire-AdEx/Ambire_AdEx_Symbol_color_white_bg.png' // ADX-TOKEN
}

export function getTokenIcon(networkId = '', address = '') {
  const addr = address.toLowerCase()
  const customIcon = customIcons[addr]

  if (customIcon) return customIcon

  const coingeckoPlatformId = coingeckoNets[networkId]

  return `https://cena.ambire.com/iconProxy/${coingeckoPlatformId}/${addr}`
}
