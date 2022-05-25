//Permit definitions
import { Interface } from 'ethers/lib/utils'

export const PERMIT_TYPE_2612 = [
  { name: "owner", type: "address" },
  { name: "spender", type: "address" },
  { name: "value", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint256" },
]

export const PERMIT_TYPE_DAI = [
  { name: "holder", type: "address" },
  { name: "spender", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "expiry", type: "uint256" },
  { name: "allowed", type: "bool" },
]

export const EIP712DomainWithVersion = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const EIP712DomainWithoutNameNorVersion = [
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const PERMITTABLE_COINS = {
  1: [
    // Without version 2
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', version: '2', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612 },

    // Without version
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap', domainType: EIP712Domain, permitType: PERMIT_TYPE_2612 },
    { address: '0xde30da39c46104798bb5aa3fe8b9e0e1f348163f', name: 'Gitcoin', domainType: EIP712Domain, permitType: PERMIT_TYPE_2612 },

    // Dai
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai Stablecoin', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_DAI },

    // Spell Token
    { address: '0x090185f2135308bad17527004364ebcc2d37e5f6', domainType: EIP712DomainWithoutNameNorVersion, permitType: PERMIT_TYPE_2612 },
    // Magic Internet Money
    { address: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3', domainType: EIP712DomainWithoutNameNorVersion, permitType: PERMIT_TYPE_2612 },

    // With version 1
    { address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', name: 'Aave Token', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612 , nonceFunction: "_nonces"},
    { name: 'AdEx Loyalty', address: '0xd9a4cb9dc9296e111c66dfacab8be034ee2e1c2c', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Aave Token', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Ambire Wallet Staking Token', address: '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'ConstitutionDAO', address: '0x7a58c0be72be218b41c608b7fe7c5bb630736c71', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Aragon Network Token', address: '0xa117000000f279d81a1d3cc75430faa017fa5a2e', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'AdEx Staking Token', address: '0xb6456b57f03352be48bf101b46c1752a0813491a', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'dYdX', address: '0x92d6c1e31e14520e676a687f0a93788b716beff5', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Ethereum Name Service', address: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Olympus', address: '0x383518188c0c6d7730d91b2c03a03c837814a899', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: '1INCH Token', address: '0x111111111117dc0aa78b770fa6a738034120c302', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'IceToken', address: '0xf16e81dce15b08f326220742020379b855b87df9', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Fei USD', address: '0x956f47f50a910163d8bf957cf5846d573e7f87ca', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'LUSD Stablecoin', address: '0x5f98805a4e8be255a32880fdec7f6728c6568ba0', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},
    { name: 'Balancer', address: '0xba100000625a3754423978a60c9317c58a424e3d', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612},

    { name: 'Aave interest bearing AAVE', address: '0xffc97d72e13e01096502cb8eb52dee56f74dad7b', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniBATWETH', address: '0xa1b0edf4460cc4d8bfaa18ed871bff15e5b57eb4', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniWBTCWETH', address: '0xc58f53a8adff2fb4eb16ed56635772075e2ee123', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniUSDCWETH', address: '0x391e86e2c002c70dee155eaceb88f7a3c38f5976', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing WETH', address: '0x030ba81f1c18d280636f32af80b9aad02cf0854e', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing DAI', address: '0x028171bca77440897b824ca71d1c56cac55b68a3', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniWBTCUSDC', address: '0x2365a4890ed8965e564b7e2d27c38ba67fec4c6f', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniCRVWETH', address: '0x0ea20e7ffb006d4cfe84df2f72d8c7bd89247db0', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniUNIWETH', address: '0x3d26dcd840fcc8e4b2193ace8a092e4a65832f9f', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing GUSD', address: '0xd37ee7e4f452c6638c96536e68090de8cbcdb583', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniMKRWETH', address: '0x370adc71f67f581158dc56f539df5f399128ddf9', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing CRV', address: '0x8dae6cb04688c62d939ed9b68d32bc62e49970b1', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market USDT', address: '0x17a79792fe6fe5c95dfe95fe3fcee3caf4fe4cb7', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market UniSNXWETH', address: '0x38e491a71291cd43e8de63b7253e482622184894', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing YFI', address: '0x5165d24277cd063f5ac44efd447b27025e888f37', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing SNX', address: '0x35f6b052c598d933d69a4eec4d04c73a191fe6c2', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market USDC', address: '0xd24946147829deaa935be2ad85a3291dbf109c80', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market DAI', address: '0x79be75ffc64dd58e66787e4eae470c8a1fd08ba4', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing USDT', address: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing RAI', address: '0xc9bc48c72154ef3e5425641a3c747242112a46af', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing BAL', address: '0x272f97b7a56a387ae942350bbc7df5700f8a4576', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing BAT', address: '0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing USDC', address: '0xbcca60bb61934080951369a648fb03df4f96263c', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave AMM Market BptBALWETH', address: '0xd109b2a304587569c84308c55465cd9ff0317bfb', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing KNC', address: '0x39c6b3e42d6a679d7d776778fe880bc9487c2eda', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing MANA', address: '0xa685a61171bb30d4072b338c80cb7b2c865c873e', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing XSUSHI', address: '0xf256cc7847e919fac9b808cc216cac87ccf2f47a', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing TUSD', address: '0x101cc05f4a51c0319f570d5e146a8c625198e636', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},
    { name: 'Aave interest bearing ENJ', address: '0xac6df26a590f08dcc95d5a4705ae8abbc88509ef', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612, nonceFunction: "_nonces"},

  ],
  137: [
    //Not working, only to test UX behavior on polygon
    { address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', name: 'USD Coin', version: '2', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612 },
  ]
}

export const ERC20PermittableInterface = new Interface([
  "function nonces(address owner) external view returns (uint256)",
  "function _nonces(address owner) external view returns (uint256)",

  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint)",
  "function balanceOf(address) external view returns (uint)",

  //2612 permit
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  //Dai permit
  "function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s)",
  "function transferFrom(address from, address to, uint256 amount) view returns (bool)",
  "function transfer(address to, uint256 amount) view returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint)"
])
