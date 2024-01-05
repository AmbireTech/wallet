import { Interface } from 'ethers/lib/utils'
import networks from 'consts/networks'
import { nativeToken, getName } from 'lib/humanReadableTransactions'

const getNetwork = (chainId, extended = false) => {
  const network = networks.find((n) => n.chainId === Number(chainId))
  return !extended ? network.name : { ...network, type: 'network' }
}

// bungee runs some of its calls through falllback that serves as router to unverified contracts,
// thats why we can't fetch data from block explorers in ambire constants
const Bungee = (humanizerInfo) => {
  const iface = new Interface(humanizerInfo.abis.StargateImplL2V2)
  return {
    // some bungee bridge txn start with 4 bytes number and the next 4 bytes are a sigHash
    // bungee uses fallback and later redirects to address based on the first 4 bytes
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
    },
    '0x00000003:0x3a23F943181408EAC424116Af7b7790c94Cb97a5': (
      txn,
      network,
      { extended = false }
    ) => {
      const parsedCallData = `0x${txn.data.slice(10)}`
      const [amountnNative, bytes32, recipient, destinationNetwork] = iface.decodeFunctionData(
        'bridgeNativeTo(uint256,bytes32,address,uint256)',
        parsedCallData
      )

      return !extended
        ? [
            `Bridge ${nativeToken(network, amountnNative)} to ${getNetwork(destinationNetwork)} ${
              recipient !== txn.from ? `and send to ${getName(humanizerInfo, recipient)}` : ''
            }`
          ]
        : [
            [
              'Bridge',
              {
                type: 'token',
                ...nativeToken(network, amountnNative, true)
              },
              'to',
              getNetwork(destinationNetwork, true),
              ...(recipient !== txn.from
                ? [
                    'and send to',
                    { type: 'address', address: recipient, name: getName(humanizerInfo, recipient) }
                  ]
                : [])
            ]
          ]
    }
  }
}
export default Bungee
