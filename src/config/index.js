export const RAMP_HOST_API_KEY = process.env.REACT_APP_RAMP_HOST_API_KEY
export const PAYTRIE_PARTNER_URL = process.env.REACT_APP_PAYTRIE_PARTNER_URL
export const TRANSAK_API_KEY = process.env.REACT_APP_TRANSAK_API_KEY
export const TRANSAK_ENV = process.env.REACT_APP_TRANSAK_ENV
export const ZAPPER_API_KEY = process.env.REACT_APP_ZAPPER_API_KEY
export const ZAPPER_API_ENDPOINT = process.env.REACT_APP_ZAPPER_API_ENDPOINT
export const OPENSEA_FRAME_URL = process.env.REACT_APP_OPENSEA_FRAME_URL
export const VELCRO_API_ENDPOINT = process.env.REACT_APP_VELCRO_API_ENDPOINT
export const SUSHI_SWAP_FRAME = process.env.REACT_APP_SUSHI_SWAP_FRAME_URL
export const SUSHI_SWAP_FRAME_EXCEPTIONS = process.env.REACT_APP_SUSHI_SWAP_FRAME_EXCEPTIONS_URL
  ? JSON.parse(process.env.REACT_APP_SUSHI_SWAP_FRAME_EXCEPTIONS_URL)
  : {}
export const SIGNATURE_VERIFIER_DEBUGGER =
  (process.env.REACT_APP_SIGNATURE_VERIFIER_DEBUGGER * 1 && true) || false
export const COINGECKO_API_URL = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3'
