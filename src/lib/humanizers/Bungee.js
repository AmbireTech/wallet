import { Interface } from 'ethers/lib/utils'
import networks from 'consts/networks'

const getNetwork = (chainId, extended = false) => {
  const network = networks.find((n) => n.chainId === Number(chainId))
  return !extended ? network.name : { ...network, type: 'network' }
}

// @TODO add in ambire-constants
const Bungee = (humanizerInfo) => {
  const iface = new Interface([
    {
      type: 'function',
      name: 'swapAndBridge',
      inputs: [
        { name: '_param1', type: 'uint32' },
        { name: '_param2', type: 'address' },
        { name: '_param3', type: 'uint256' },
        { name: '_param4', type: 'bytes32' },
        { name: '_param5', type: 'bytes' }
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'payable'
    },
    {
      type: 'function',
      name: 'swapAndBridge',
      inputs: [
        { name: '_param1', type: 'uint32' },
        { name: '_param2', type: 'bytes' },
        {
          name: '_param3',
          type: 'tuple',
          components: [
            { name: '_address1', type: 'address' },
            { name: '_address2', type: 'address' },
            { name: '_uint1', type: 'uint256' },
            { name: '_uint2', type: 'uint256' },
            { name: '_uint3', type: 'uint256' },
            { name: '_uint4', type: 'uint256' },
            { name: '_uint5', type: 'uint256' },
            { name: '_uint6', type: 'uint256' },
            { name: '_bytes32', type: 'bytes32' }
          ]
        }
      ],
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'payable'
    }
  ])
  return {
    // some bungee bridge txn start with bytes32 number and the next 4 bytes are the sigHash
    // uses fallback router
    '0x00000005:0x3a23F943181408EAC424116Af7b7790c94Cb97a5': (
      txn,
      network,
      { extended = false }
    ) => {
      const parsedCallData = `0x${txn.data.slice(10)}`
      const [_number, recipient, chainId, _bytes, _moreData] = iface.decodeFunctionData(
        'swapAndBridge(uint32,address,uint256,bytes32,bytes)',
        parsedCallData
      )
      return !extended
        ? [`Bridge tokens on Bungee to ${getNetwork(chainId)}`]
        : [['Bridge', 'tokens on Bungee to', getNetwork(chainId, true)]]
    },
    '0x00000016:0x3a23F943181408EAC424116Af7b7790c94Cb97a5': (
      txn,
      network,
      { extended = false }
    ) => {
      const parsedCallData = `0x${txn.data.slice(10)}`
      const [_number, _data, [address1, address2, destinationNetwork]] = iface.decodeFunctionData(
        'swapAndBridge(uint32,bytes,(address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes32))',
        parsedCallData
      )
      return !extended
        ? [`Bridge tokens on Bungee to ${getNetwork(destinationNetwork)}`]
        : [['Bridge', 'tokens on Bungee to', getNetwork(destinationNetwork, true)]]
    }
  }
}
export default Bungee
