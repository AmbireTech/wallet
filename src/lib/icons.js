const customIcons = {
    '0xb468a1e5596cfbcdf561f21a10490d99b4bb7b68': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Jeff_Sessions_with_Elmo_and_Rosita_%28cropped%29.jpg/220px-Jeff_Sessions_with_Elmo_and_Rosita_%28cropped%29.jpg', // TEST Polygon ELMO token,
    '0x88800092ff476844f74dc2fc427974bbee2794ae': 'https://raw.githubusercontent.com/AmbireTech/ambire-brand/main/logos/Ambire_logo_250x250.png' // Ambire Wallet Token
}

const zapperStorageTokenIcons = 'https://storage.googleapis.com/zapper-fi-assets/tokens'

export function getTokenIcon(networkId = '', address = '') {
    const addr = address.toLowerCase()
    const net = networkId.toLowerCase()
    return customIcons[addr] || `${zapperStorageTokenIcons}/${net}/${addr}.png`
}