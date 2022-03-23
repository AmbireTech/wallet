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

export const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const PERMITTABLE_COINS = {
  1: [
    { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', version: '2', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612 },
    { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap', domainType: EIP712Domain, permitType: PERMIT_TYPE_2612 },
    { address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai Stablecoin', version: '1', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_DAI },
  ],
  137: [
    //Not working, only to test UX behavior on polygon
    //{ address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', name: 'USD Coin', version: '2', domainType: EIP712DomainWithVersion, permitType: PERMIT_TYPE_2612 },
  ]
}

export const ERC20PermittableInterface = new Interface([
  "function nonces(address owner) external view returns (uint256)",
  "function name() external view returns (string)",
  //2612 permit
  "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)",
  //Dai permit
  "function permit(address holder, address spender, uint256 nonce, uint256 expiry, bool allowed, uint8 v, bytes32 r, bytes32 s)",
  "function transferFrom(address from, address to, uint256 amount) view returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint)"
])
