import { DappManifestData } from './types'

const DEFAULT_CATALOG: Array<DappManifestData> = [
  {
    name: 'allowance_checker',
    title: 'Allowance checker',
    url: '#/wallet/gnosis/plugins/allowances-checker',
    logo: '/resources/plugins/allowances.png',
    description: 'Check and modify the risk and exposition of your Tokens',
    type: 'integrated',
    networks: []
  },
  {
    name: 'transaction_builder',
    title: 'Transaction Builder',
    url: '#/wallet/gnosis/plugins/txbuilder',
    logo: 'https://safe-apps.dev.gnosisdev.com/tx-builder/tx-builder.png',
    description: 'Build your transaction from scratch (Power users)',
    type: 'integrated',
    networks: []
  },
  {
    name: 'uniswap',
    title: 'Uniswap',
    url: 'https://app.uniswap.org',
    logo: 'https://app.uniswap.org/favicon.png',
    description: 'Uniswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon']
  },
  {
    name: 'sushiswap',
    title: 'Sushiswap',
    url: 'https://app.sushi.com',
    logo: 'https://res.cloudinary.com/sushi-cdn/image/fetch/f_auto,c_limit,w_48,q_auto/https://app.sushi.com/images/logo.svg',
    description: 'Sushiswap decentralised exchange',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    name: 'opensea',
    title: 'Opensea',
    url: '#/wallet/gnosis/plugins/opensea',
    logo: 'https://opensea.io/static/images/logos/opensea.svg',
    description: 'Opensea NFT marketplace',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'binance-smart-chain', 'fantom', 'gnosis']
  },
  {
    name: 'pancakeswap',
    title: 'PancakeSwap',
    url: 'https://pancakeswap.finance/',
    logo: 'https://avatars.githubusercontent.com/u/71247426?s=200&v=4',
    description: 'PancakeSwap decentralised exchange',
    type: 'walletconnect',
    networks: ['binance-smart-chain']
  },
  {
    name: 'quickswap',
    title: 'Quickswap',
    url: 'https://quickswap.exchange',
    logo: 'https://avatars.githubusercontent.com/u/77100292?s=200&v=4',
    description: 'Quickswap decentralised exchange',
    type: 'walletconnect',
    networks: ['polygon']
  },
  {
    name: 'evm_sigtools',
    title: 'EVM Sigtools',
    url: 'https://ambiretech.github.io/evm-sigtools-public/',
    logo: 'https://ambiretech.github.io/evm-sigtools-public/img/signature-validator-logo-flat.png',
    description: 'Sign, verify and share ethereum messages',
    type: 'walletconnect',
    networks: []
  },
  {
    name: 'aave',
    title: 'Aave',
    url: 'https://app.aave.com/',
    logo: 'https://www.gitbook.com/cdn-cgi/image/width=40,height=40,fit=contain,dpr=1,format=auto/https%3A%2F%2F2799188404-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fspaces%252F-M6U5cfvZsVW8zOEpVl1%252Favatar-1595317514145.png%3Fgeneration%3D1595317514421109%26alt%3Dmedia',
    description: 'Decentralised exchange and lending platform',
    type: 'walletconnect',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
  {
    name: 'txbuilder',
    title: 'TxBuilder',
    url: 'https://safe-apps.dev.gnosisdev.com/tx-builder/',
    logo: 'https://safe-apps.dev.gnosisdev.com/tx-builder/logo.svg',
    description: 'Local dapp test with some lorem ipsum stuff',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
  {
    name: 'paraswap',
    title: 'ParaSwap',
    url: 'https://paraswap.io',
    logo: 'https://paraswap.io/paraswap.svg',
    description: 'ParaSwap allows dApps and traders to get the best DEX liquidity by aggregating multiple markets and offering the best rates',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
  {
    name: '0cplasmafinance',
    title: '0xPlasma Finance',
    url: 'https://apy.plasma.finance',
    logo: 'https://apy.plasma.finance/logo.svg',
    description: 'Cross-chain DeFi & DEX aggregator, farming, asset management, fiat on-ramp',
    type: 'integrated',
    networks: ['ethereum', 'polygon', 'avalanche', 'fantom', 'arbitrum', 'harmony', 'optimism']
  },
]

export {
  DEFAULT_CATALOG
}