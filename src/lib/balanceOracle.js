import { ethers, getDefaultProvider } from 'ethers'
import networks from '../consts/networks'
import oracle from 'adex-protocol-eth/abi/RemainingBalancesOracle.json'
const { Interface, AbiCoder, formatUnits, hexlify, isAddress } = ethers.utils
const RemainingBalancesOracle = new Interface(oracle)
const SPOOFER = '0x0000000000000000000000000000000000000001'
const blockTag = 'pending'
const remainingBalancesOracleAddr = '0xF1628de74193Dde3Eed716aB0Ef31Ca2b6347eB1'

// Signature of Error(string)
const ERROR_SIG = '0x08c379a0'
// Signature of Panic(uint256)
const PANIC_SIG = '0x4e487b71'

async function getTokenListBalance ({walletAddr, tokens, network, updateBalance}) {
  let result = await call ( {walletAddr, tokens, network} )
  if (result.success) {
    const newBalance = tokens.map(t => {
      const newTokenBalance = result.data.filter(r => r.address === t.address && parseFloat(r.balance) > 0)[0]
      return (newTokenBalance ? {
        "type": "base",
        "network": network,
        "address": newTokenBalance.address,
        "decimals": newTokenBalance.decimals,
        "symbol": newTokenBalance.symbol,
        "price": newTokenBalance.price || 0,
        "balance": Number(newTokenBalance.balance),
        "balanceRaw": newTokenBalance.balanceRaw,
        "updateAt": (new Date()).toString(),
        "balanceUSD": Number(parseFloat(newTokenBalance.price * newTokenBalance.balance || 0).toFixed(2)),
        "tokenImageUrl": newTokenBalance.tokenImageUrl || `https://storage.googleapis.com/zapper-fi-assets/tokens/${network}/${newTokenBalance.address}.png`
      } : t)
    }).filter (t => t && t.balance && parseFloat(t.balance) > 0)
    if (updateBalance && typeof updateBalance === 'function') updateBalance(newBalance)
    return newBalance
  } else {
    console.error(result.message, result.data)
    return tokens
  }
}

//ToDo check for missing data and double check for incompleted returns
async function call ({ walletAddr, tokens, network }) {
  if (!isAddress(walletAddr)) return {success: false, data: walletAddr, message:`Wallet address is not valide eth address`}
  const provider = getDefaultProvider(networks.filter(n => n.id===network)[0]?.rpc || null)
  const coder = new AbiCoder()
  const args = [
    // identityFactoryAddr
    '0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA',
    // bytecode dummy.sol
    '0x6080604052348015600f57600080fd5b50604880601d6000396000f3fe6080604052348015600f57600080fd5b5000fea2646970667358221220face6a0e4f251ee8ded32eb829598230ad218691166fa0a46bc85583c202c60c64736f6c634300080a0033',
    // salt
    '0x0000000000000000000000000000000000000000000000000000000000000001',
    // txns
    [['0x0000000000000000000000000000000000000000', '0x0', '0x0000000000000000000000000000000000000000']],
    '0x000000000000000000000000000000000000000000000000000000000000000000',
    walletAddr,
    tokens.map(x => x.address)
  ]
  const txParams = {
    from: SPOOFER,
    to: remainingBalancesOracleAddr,
    data: RemainingBalancesOracle.encodeFunctionData('getRemainingBalances', args)
  }
  try {
    const callResult = await provider.call(txParams, blockTag)
    // @TODO: would be more appropriate to throw here
    if (isErr(callResult)) return {success: false, data: tokens, message: `probably one ot following tokens is not ERC20 and missing balanceOf()`} //hex2a(callResult)
    const balances = coder.decode(['uint[]'], callResult)[0]
    const result = tokens.map((x, i) => ({ ...x, balanceRaw: balances[i].toString(), balance: parseFloat(formatUnits(balances[i], x.decimals)).toFixed(10) }))
    return {success: true, data: result}
  } catch(e){
    return {success: false, data: tokens, message: `probably one ot following tokens is not ERC20 and missing balanceOf()`}
  }
}

function hex2a (hexx) {
	var hex = hexx.toString()
	var str = ''
	for (var i = 0; i < hex.length; i += 2) { str += String.fromCharCode(parseInt(hex.substr(i, 2), 16)) }
	return str
}
 
function isErr (hex) {
	return hex.startsWith(ERROR_SIG) || hex.startsWith(PANIC_SIG)
}

async function getErrMsg (provider, txParams, blockTag) {
	// .call always returns a hex string with ethers
	try {
		// uncomment if you need HEVM debugging
		// console.log(`hevm exec --caller ${txParams.from} --address ${txParams.to} --calldata ${txParams.data} --gas 1000000 --debug --rpc ${provider.connection.rpc} ${!isNaN(blockTag) && blockTag ? '--block '+blockTag : ''}`)
		const returnData = await provider.call(txParams, blockTag)
		return isErr(returnData)
			? (new AbiCoder()).decode(['string'], '0x' + returnData.slice(10))[0]
			: returnData
	} catch (e) {
		// weird infura case
		if (e.code === 'UNPREDICTABLE_GAS_LIMIT' && e.error) return e.error.message.slice(20)
		if (e.code === 'CALL_EXCEPTION') return 'no error string, possibly insufficient amount or wrong SmartWallet sig'
		if (e.code === 'INVALID_ARGUMENT') return `unable to deserialize: ${hexlify(e.value)}`
		throw e
	}
}

const tokenList = {
  ethereum: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "ETH", coingeckoId: null, decimals: 18 },
    { address: "0xa258c4606ca8206d8aa700ce2143d7db854d168c", symbol: "yvWETH", coingeckoId: null, decimals: 18 },
    { address: "0xa354f35829ae975e850e23e9615b11da1b3dc4de", symbol: "yvUSDC", coingeckoId: null, decimals: 6 },
    { address: "0x7da96a3891add058ada2e826306d812c638d87a7", symbol: "yvUSDT", coingeckoId: null, decimals: 6 },
    { address: "0xda816459f1ab5631232fe5e97a05bbbb94970c95", symbol: "yvDAI", coingeckoId: null, decimals: 18 },
    { address: "0x6d765cbe5bc922694afe112c140b8878b9fb0390", symbol: "yvSUSHI", coingeckoId: null, decimals: 18 },
    { address: "0xd9788f3931ede4d5018184e198699dc6d66c1915", symbol: "yvAAVE", coingeckoId: null, decimals: 18 },
    { address: "0x4a3fe75762017db0ed73a71c9a06db7768db5e66", symbol: "yvCOMP", coingeckoId: null, decimals: 18 },
    { address: "0xfd0877d9095789caf24c98f7cce092fa8e120775", symbol: "yvTUSD", coingeckoId: null, decimals: 18 },
    { address: "0xe11ba472f74869176652c35d30db89854b5ae84d", symbol: "yvHEGIC", coingeckoId: null, decimals: 18 },
    { address: "0xdcd90c7f6324cfa40d7169ef80b12031770b4325", symbol: "yvCurve-stETH", coingeckoId: null, decimals: 18 },
    { address: "0x19d3364a399d251e894ac732651be8b0e4e85001", symbol: "yvDAI", coingeckoId: null, decimals: 18 },
    { address: "0x5f18c75abdae578b483e5f43f12a39cf75b973a9", symbol: "yvUSDC", coingeckoId: null, decimals: 6 },
    { address: "0xcb550a6d4c8e3517a939bc79d0c7093eb7cf56b5", symbol: "yvWBTC", coingeckoId: null, decimals: 8 },
    { address: "0x986b4aff588a109c09b50a03f42e4110e29d353f", symbol: "yvCurve-sETH", coingeckoId: null, decimals: 18 },
    { address: "0xa9fe4601811213c340e850ea305481aff02f5b28", symbol: "yvWETH", coingeckoId: null, decimals: 18 },
    { address: "0xb8c3b7a2a618c552c23b1e4701109a9e756bab67", symbol: "yv1INCH", coingeckoId: null, decimals: 18 },
    { address: "0xe14d13d8b3b85af791b2aadd661cdbd5e6097db1", symbol: "yvYFI", coingeckoId: null, decimals: 18 },
    { address: "0x27b7b1ad7288079a66d12350c828d3c00a6f07d7", symbol: "yvCurve-IronBank", coingeckoId: null, decimals: 18 },
    { address: "0xa5ca62d95d24a4a350983d5b8ac4eb8638887396", symbol: "yvsUSD", coingeckoId: null, decimals: 18 },
    { address: "0x625b7df2fa8abe21b0a976736cda4775523aed1e", symbol: "yvCurve-HBTC", coingeckoId: null, decimals: 18 },
    { address: "0xa696a63cc78dffa1a63e9e50587c197387ff6c7e", symbol: "yvWBTC", coingeckoId: null, decimals: 8 },
    { address: "0x9d409a0a012cfba9b15f6d4b36ac57a46966ab9a", symbol: "yvBOOST", coingeckoId: "yvboost", decimals: 18 },
    { address: "0x8414db07a7f743debafb402070ab01a4e0d2e45e", symbol: "yvCurve-sBTC", coingeckoId: null, decimals: 18 },
    { address: "0x7047f90229a057c13bf847c0744d646cfb6c9e1a", symbol: "yvCurve-renBTC", coingeckoId: null, decimals: 18 },
    { address: "0xb4d1be44bff40ad6e506edf43156577a3f8672ec", symbol: "yvCurve-sAave", coingeckoId: null, decimals: 18 },
    { address: "0x8ee57c05741aa9db947a744e713c15d4d19d8822", symbol: "yvCurve-yBUSD", coingeckoId: null, decimals: 18 },
    { address: "0xd6ea40597be05c201845c0bfd2e96a60bacde267", symbol: "yvCurve-Compound", coingeckoId: null, decimals: 18 },
    { address: "0x84e13785b5a27879921d6f685f041421c7f482da", symbol: "yvCurve-3pool", coingeckoId: null, decimals: 18 },
    { address: "0xf29ae508698bdef169b89834f76704c3b205aedf", symbol: "yvSNX", coingeckoId: null, decimals: 18 },
    { address: "0xb4ada607b9d6b2c9ee07a275e9616b84ac560139", symbol: "yvCurve-FRAX", coingeckoId: null, decimals: 18 },
    { address: "0x5fa5b62c8af877cb37031e0a3b2f34a78e3c56a6", symbol: "yvCurve-LUSD", coingeckoId: null, decimals: 18 },
    { address: "0x6ede7f19df5df6ef23bd5b9cedb651580bdf56ca", symbol: "yvCurve-BUSD", coingeckoId: null, decimals: 18 },
    { address: "0x4b5bfd52124784745c1071dcb244c6688d2533d3", symbol: "yUSD", coingeckoId: null, decimals: 18 },
    { address: "0xe9dc63083c464d6edccff23444ff3cfc6886f6fb", symbol: "yvCurve-oBTC", coingeckoId: null, decimals: 18 },
    { address: "0x3c5df3077bcf800640b5dae8c91106575a4826e6", symbol: "yvCurve-pBTC", coingeckoId: null, decimals: 18 },
    { address: "0x8fa3a9ecd9efb07a8ce90a6eb014cf3c0e3b32ef", symbol: "yvCurve-BBTC", coingeckoId: null, decimals: 18 },
    { address: "0x132d8d2c76db3812403431facb00f3453fc42125", symbol: "yvCurve-ankrETH", coingeckoId: null, decimals: 18 },
    { address: "0x30fcf7c6cdfc46ec237783d94fc78553e79d4e9c", symbol: "yvCurve-DUSD", coingeckoId: null, decimals: 18 },
    { address: "0x8cc94ccd0f3841a468184aca3cc478d2148e1757", symbol: "yvCurve-mUSD", coingeckoId: null, decimals: 18 },
    { address: "0x1c6a9783f812b3af3abbf7de64c3cd7cc7d1af44", symbol: "yvCurve-UST", coingeckoId: null, decimals: 18 },
    { address: "0x054af22e1519b020516d72d749221c24756385c9", symbol: "yvCurve-HUSD", coingeckoId: null, decimals: 18 },
    { address: "0x25212df29073fffa7a67399acefc2dd75a831a1a", symbol: "yvCurve-EURS", coingeckoId: null, decimals: 18 },
    { address: "0x2a38b9b0201ca39b17b460ed2f11e4929559071e", symbol: "yvCurve-GUSD", coingeckoId: null, decimals: 18 },
    { address: "0x23d3d0f1c697247d5e0a9efb37d8b0ed0c464f7f", symbol: "yvCurve-tBTC", coingeckoId: null, decimals: 18 },
    { address: "0x3b96d491f067912d18563d56858ba7d6ec67a6fa", symbol: "yvCurve-USDN", coingeckoId: null, decimals: 18 },
    { address: "0xf2db9a7c0acd427a680d640f02d90f6186e71725", symbol: "yvCurve-LINK", coingeckoId: null, decimals: 18 },
    { address: "0x5a770dbd3ee6baf2802d29a901ef11501c44797a", symbol: "yvCurve-sUSD", coingeckoId: null, decimals: 18 },
    { address: "0x39caf13a104ff567f71fd2a4c68c026fdb6e740b", symbol: "yvCurve-Aave", coingeckoId: null, decimals: 18 },
    { address: "0xc4daf3b5e2a9e93861c3fbdd25f1e943b8d87417", symbol: "yvCurve-USDP", coingeckoId: null, decimals: 18 },
    { address: "0xf8768814b88281de4f532a3beefa5b85b69b9324", symbol: "yvCurve-TUSD", coingeckoId: null, decimals: 18 },
    { address: "0xfbeb78a723b8087fd2ea7ef1afec93d35e8bed42", symbol: "yvUNI", coingeckoId: null, decimals: 18 },
    { address: "0xa74d4b67b3368e83797a35382afb776baae4f5c8", symbol: "yvCurve-alUSD", coingeckoId: null, decimals: 18 },
    { address: "0xbfedbcbe27171c418cdabc2477042554b1904857", symbol: "yvCurve-rETH", coingeckoId: null, decimals: 18 },
    { address: "0x671a912c10bba0cfa74cfc2d6fba9ba1ed9530b2", symbol: "yvLINK", coingeckoId: null, decimals: 18 },
    { address: "0x873fb544277fd7b977b196a826459a69e27ea4ea", symbol: "yvRAI", coingeckoId: null, decimals: 18 },
    { address: "0x3d980e50508cfd41a13837a60149927a11c03731", symbol: "yvCurve-triCrypto", coingeckoId: null, decimals: 18 },
    { address: "0x80bbee2fa460da291e796b9045e93d19ef948c6a", symbol: "yvCurve-PAX", coingeckoId: null, decimals: 18 },
    { address: "0x28a5b95c101df3ded0c0d9074db80c438774b6a9", symbol: "yvCurve-USDT", coingeckoId: null, decimals: 18 },
    { address: "0x3d27705c64213a5dcd9d26880c1bcfa72d5b6b0e", symbol: "yvCurve-USDK", coingeckoId: null, decimals: 18 },
    { address: "0xc116df49c02c5fd147de25baa105322ebf26bd97", symbol: "yvCurve-RSV", coingeckoId: null, decimals: 18 },
    { address: "0xe537b5cc158eb71037d4125bdd7538421981e6aa", symbol: "yvCurve-3Crypto", coingeckoId: null, decimals: 18 },
    { address: "0x0d4ea8536f9a13e4fba16042a46c30f092b06aa5", symbol: "yvCurve-EURT", coingeckoId: null, decimals: 18 },
    { address: "0xade00c28244d5ce17d72e40330b1c318cd12b7c3", symbol: "ADX", coingeckoId: "adex", decimals: 18 },
    { address: "0xb6456b57f03352be48bf101b46c1752a0813491a", symbol: "ADX-STAKING", decimals: 18 },
    { address: "0xd9a4cb9dc9296e111c66dfacab8be034ee2e1c2c", symbol: "ADX-LOYALTY", decimals: 18 },
    { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", coingeckoId: "tether", decimals: 6 },
    { address: "0x4fabb145d64652a948d72533023f6e7a623c7c53", symbol: "BUSD", coingeckoId: "binance-usd", decimals: 18 },
    { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", coingeckoId: "usd-coin", decimals: 6 },
    { address: "0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0", symbol: "MATIC", coingeckoId: "matic-network", decimals: 18 },
    { address: "0xfe39e6a32acd2af7955cb3d406ba2b55c901f247", symbol: "ZT", coingeckoId: "ztcoin", decimals: 18 },
    { address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce", symbol: "SHIB", coingeckoId: "shiba-inu", decimals: 18 },
    { address: "0xfcf8eda095e37a41e002e266daad7efc1579bc0a", symbol: "FLEX", coingeckoId: "flex-coin", decimals: 18 },
    { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", symbol: "WETH", coingeckoId: "weth", decimals: 18 },
    { address: "0x15d4c048f83bd7e37d49ea4c83a07267ec4203da", symbol: "GALA", coingeckoId: "gala", decimals: 8 },
    { address: "0x514910771af9ca656af840dff83e8264ecf986ca", symbol: "LINK", coingeckoId: "chainlink", decimals: 18 },
    { address: "0x75231f58b43240c9718dd58b4967c5114342a86c", symbol: "OKB", coingeckoId: "okb", decimals: 18 },
    { address: "0x3845badade8e6dff049820680d1f14bd3903a5d0", symbol: "SAND", coingeckoId: "the-sandbox", decimals: 18 },
    { address: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", symbol: "SUSHI", coingeckoId: "sushi", decimals: 18 },
    { address: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", coingeckoId: "dai", decimals: 18 },
    { address: "0x0f5d2fb29fb7d3cfee444a200298f468908cc942", symbol: "MANA", coingeckoId: "decentraland", decimals: 18 },
    { address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", symbol: "WBTC", coingeckoId: "wrapped-bitcoin", decimals: 8 },
    { address: "0x1f3f677ecc58f6a1f9e2cf410df4776a8546b5de", symbol: "VNDC", coingeckoId: "vndc", decimals: 0 },
    { address: "0x4e15361fd6b4bb609fa63c81a2be19d873717870", symbol: "FTM", coingeckoId: "fantom", decimals: 18 },
    { address: "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd", symbol: "LRC", coingeckoId: "loopring", decimals: 18 },
    { address: "0xd26114cd6ee289accf82350c8d8487fedb8a0c07", symbol: "OMG", coingeckoId: "omisego", decimals: 18 },
    { address: "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3", symbol: "MIM", coingeckoId: "magic-internet-money", decimals: 18 },
    { address: "0xef40b859d21e4d566a3d713e756197c021bffaaa", symbol: "NFT", coingeckoId: "apenft", decimals: 6 },
    { address: "0xbb0e17ef65f82ab018d8edd776e8dd940327b28b", symbol: "AXS", coingeckoId: "axie-infinity", decimals: 18 },
    { address: "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b", symbol: "CRO", coingeckoId: "crypto-com-chain", decimals: 8 },
    { address: "0x7a58c0be72be218b41c608b7fe7c5bb630736c71", symbol: "PEOPLE", coingeckoId: "constitutiondao", decimals: 18 },
    { address: "0x1c48f86ae57291f7686349f12601910bd8d470bb", symbol: "USDK", coingeckoId: "usdk", decimals: 18 },
    { address: "0xd533a949740bb3306d119cc777fa900ba034cd52", symbol: "CRV", coingeckoId: "curve-dao-token", decimals: 18 },
    { address: "0x0d8775f648430679a709e98d2b0cb6250d2887ef", symbol: "BAT", coingeckoId: "basic-attention-token", decimals: 18 },
    { address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", symbol: "UNI", coingeckoId: "uniswap", decimals: 18 },
    { address: "0xa47c8bf37f92abed4a126bda807a7b7498661acd", symbol: "UST", coingeckoId: "terrausd", decimals: 18 },
    { address: "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c", symbol: "ENJ", coingeckoId: "enjincoin", decimals: 18 },
    { address: "0x6c6ee5e31d828de241282b9606c8e98ea48526e2", symbol: "HOT", coingeckoId: "holotoken", decimals: 18 },
    { address: "0xe1ba0fb44ccb0d11b80f92f4f8ed94ca3ff51d00", symbol: "ABAT", coingeckoId: "aave-bat-v1", decimals: 18 },
    { address: "0x6f259637dcd74c767781e37bc6133cd6a68aa161", symbol: "HT", coingeckoId: "huobi-token", decimals: 18 },
    { address: "0x3506424f91fd33084466f402d5d97f05f8e3b4af", symbol: "CHZ", coingeckoId: "chiliz", decimals: 18 },
    { address: "0x92d6c1e31e14520e676a687f0a93788b716beff5", symbol: "DYDX", coingeckoId: "dydx", decimals: 18 },
    { address: "0xa117000000f279d81a1d3cc75430faa017fa5a2e", symbol: "ANT", coingeckoId: "aragon", decimals: 18 },
    { address: "0x111111111117dc0aa78b770fa6a738034120c302", symbol: "1INCH", coingeckoId: "1inch", decimals: 18 },
    { address: "0x956f47f50a910163d8bf957cf5846d573e7f87ca", symbol: "FEI", coingeckoId: "fei-usd", decimals: 18 },
    { address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9", symbol: "AAVE", coingeckoId: "aave", decimals: 18 },
    { address: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e", symbol: "YFI", coingeckoId: "yearn-finance", decimals: 18 },
    { address: "0x744d70fdbe2ba4cf95131626614a1763df805b9e", symbol: "SNT", coingeckoId: "status", decimals: 18 },
    { address: "0xc944e90c64b2c07662a292be6244bdf05cda44a7", symbol: "GRT", coingeckoId: "the-graph", decimals: 18 },
    { address: "0x0000000000085d4780b73119b644ae5ecd22b376", symbol: "TUSD", coingeckoId: "true-usd", decimals: 18 },
    { address: "0x26fb86579e371c7aedc461b2ddef0a8628c93d3b", symbol: "BORA", coingeckoId: "bora", decimals: 18 },
    { address: "0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5", symbol: "BIT", coingeckoId: "bitdao", decimals: 18 },
    { address: "0x940a2db1b7008b6c776d4faaca729d6d4a4aa551", symbol: "DUSK", coingeckoId: "dusk-network", decimals: 18 },
    { address: "0x9d91be44c06d373a8a226e1f3b146956083803eb", symbol: "AKNC", coingeckoId: "aave-knc-v1", decimals: 18 },
    { address: "0xac51066d7bec65dc4589368da368b212745d63e8", symbol: "ALICE", coingeckoId: "my-neighbor-alice", decimals: 6 },
    { address: "0x9534ad65fb398e27ac8f4251dae1780b989d136e", symbol: "PYR", coingeckoId: "vulcan-forged", decimals: 18 },
    { address: "0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9", symbol: "FTT", coingeckoId: "ftx-token", decimals: 18 },
    { address: "0xc00e94cb662c3520282e6f5717214004a7f26888", symbol: "COMP", coingeckoId: "compound-governance-token", decimals: 18 },
    { address: "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72", symbol: "ENS", coingeckoId: "ethereum-name-service", decimals: 18 },
    { address: "0x24efe6b87bf1bfe9ea2ccb5a9d0a959c7172b364", symbol: "GAT", coingeckoId: "global-aex-token", decimals: 0 },
    { address: "0xcc8fa225d80b9c7d42f96e9570156c65d6caaa25", symbol: "SLP", coingeckoId: "smooth-love-potion", decimals: 0 },
    { address: "0x383518188c0c6d7730d91b2c03a03c837814a899", symbol: "OHM", coingeckoId: "olympus", decimals: 9 },
    { address: "0x38e4adb44ef08f22f5b5b76a8f0c2d0dcbe7dca1", symbol: "CVP", coingeckoId: "concentrated-voting-power", decimals: 18 },
    { address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2", symbol: "MKR", coingeckoId: "maker", decimals: 18 },
    { address: "0x3b58c52c03ca5eb619eba171091c86c34d603e5f", symbol: "CYCLUB", coingeckoId: "mci-coin", decimals: 9 },
    { address: "0x1cf4592ebffd730c7dc92c1bdffdfc3b9efcf29a", symbol: "WAVES", coingeckoId: "waves", decimals: 18 },
    { address: "0x888888848b652b3e3a0f34c96e00eec0f3a23f72", symbol: "TLM", coingeckoId: "alien-worlds", decimals: 4 },
    { address: "0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24", symbol: "RNDR", coingeckoId: "render-token", decimals: 18 },
    { address: "0x12bb890508c125661e03b09ec06e404bc9289040", symbol: "RACA", coingeckoId: "radio-caca", decimals: 18 },
    { address: "0xf57e7e7c23978c3caec3c3548e3d615c346e79ff", symbol: "IMX", coingeckoId: "immutable-x", decimals: 18 },
    { address: "0x476c5e26a75bd202a9683ffd34359c0cc15be0ff", symbol: "SRM", coingeckoId: "serum", decimals: 6 },
    { address: "0xdf574c24545e5ffecb9a659c229253d4111d87e1", symbol: "HUSD", coingeckoId: "husd", decimals: 8 },
    { address: "0x8290333cef9e6d528dd5618fb97a76f268f3edd4", symbol: "ANKR", coingeckoId: "ankr", decimals: 18 },
    { address: "0x4fe83213d56308330ec302a8bd641f1d0113a4cc", symbol: "NU", coingeckoId: "nucypher", decimals: 18 },
    { address: "0xe41d2489571d322189246dafa5ebde1f4699f498", symbol: "ZRX", coingeckoId: "0x", decimals: 18 },
    { address: "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667", symbol: "CELR", coingeckoId: "celer-network", decimals: 18 },
    { address: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f", symbol: "SNX", coingeckoId: "havven", decimals: 18 },
    { address: "0x8762db106b2c2a0bccb3a80d1ed41273552616e8", symbol: "RSR", coingeckoId: "reserve-rights-token", decimals: 18 },
    { address: "0x4a220e6096b25eadb88358cb44068a3248254675", symbol: "QNT", coingeckoId: "quant-network", decimals: 18 },
    { address: "0x081131434f93063751813c619ecca9c4dc7862a3", symbol: "DAR", coingeckoId: "mines-of-dalarnia", decimals: 6 },
    { address: "0xd2877702675e6ceb975b4a1dff9fb7baf4c91ea9", symbol: "LUNA", coingeckoId: "wrapped-terra", decimals: 18 },
    { address: "0x8a2279d4a90b6fe1c4b30fa660cc9f926797baa2", symbol: "CHR", coingeckoId: "chromaway", decimals: 6 },
    { address: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c", symbol: "BNT", coingeckoId: "bancor", decimals: 18 },
    { address: "0x25f8087ead173b73d6e8b84329989a8eea16cf73", symbol: "YGG", coingeckoId: "yield-guild-games", decimals: 18 },
    { address: "0x090185f2135308bad17527004364ebcc2d37e5f6", symbol: "SPELL", coingeckoId: "spell-token", decimals: 18 },
    { address: "0x69af81e73a73b40adf4f3d4223cd9b1ece623074", symbol: "MASK", coingeckoId: "mask-network", decimals: 18 },
    { address: "0xa1d0e215a23d7030842fc67ce582a6afa3ccab83", symbol: "YFII", coingeckoId: "yfii-finance", decimals: 18 },
    { address: "0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac", symbol: "STORJ", coingeckoId: "storj", decimals: 8 },
    { address: "0x8f8221afbb33998d8584a2b05749ba73c37a938a", symbol: "REQ", coingeckoId: "request-network", decimals: 18 },
    { address: "0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9", symbol: "SXP", coingeckoId: "swipe", decimals: 18 },
    { address: "0x408e41876cccdc0f92210600ef50372656052a38", symbol: "REN", coingeckoId: "republic-protocol", decimals: 18 },
    { address: "0x441761326490cacf7af299725b6292597ee822c2", symbol: "UNFI", coingeckoId: "unifi-protocol-dao", decimals: 18 },
    { address: "0x2fde5357c4715b12e754aaf2b85722ef803cb0b9", symbol: "KLAYG", coingeckoId: "klaygames", decimals: 18 },
    { address: "0x767fe9edc9e0df98e07454847909b5e959d7ca0e", symbol: "ILV", coingeckoId: "illuvium", decimals: 18 },
    { address: "0xdd974d5c2e2928dea5f71b9825b8b646686bd200", symbol: "KNCL", coingeckoId: "kyber-network", decimals: 18 },
    { address: "0xf411903cbc70a74d22900a5de66a2dda66507255", symbol: "VRA", coingeckoId: "verasity", decimals: 18 },
    { address: "0x4575f41308ec1483f3d399aa9a2826d74da13deb", symbol: "OXT", coingeckoId: "orchid-protocol", decimals: 18 },
    { address: "0x7420b4b9a0110cdc71fb720908340c03f9bc03ec", symbol: "JASMY", coingeckoId: "jasmycoin", decimals: 18 },
    { address: "0xddb3422497e61e13543bea06989c0789117555c5", symbol: "COTI", coingeckoId: "coti", decimals: 18 },
    { address: "0xc07a150ecadf2cc352f5586396e344a6b17625eb", symbol: "BIOT", coingeckoId: "biopassport", decimals: 9 },
    { address: "0x3f382dbd960e3a9bbceae22651e88158d2791550", symbol: "GHST", coingeckoId: "aavegotchi", decimals: 18 },
    { address: "0xb5c578947de0fd71303f71f2c3d41767438bd0de", symbol: "DEVT", coingeckoId: "dehorizon", decimals: 18 },
    { address: "0x814e0908b12a99fecf5bc101bb5d0b8b5cdf7d26", symbol: "MDT", coingeckoId: "measurable-data-token", decimals: 18 },
    { address: "0x4691937a7508860f876c9c0a2a617e7d9e945d4b", symbol: "WOO", coingeckoId: "woo-network", decimals: 18 },
    { address: "0xf17e65822b568b3903685a7c9f496cf7656cc6c2", symbol: "BICO", coingeckoId: "biconomy", decimals: 18 },
    { address: "0x39aa39c021dfbae8fac545936693ac917d5e7563", symbol: "CUSDC", coingeckoId: "compound-usd-coin", decimals: 8 },
    { address: "0xffc97d72e13e01096502cb8eb52dee56f74dad7b", symbol: "aAAVE", coingeckoId: "aave-aave", decimals: 18 },
    { address: "0xd109b2a304587569c84308c55465cd9ff0317bfb", symbol: "aAmmBptBALWETH", coingeckoId: "aave-amm-bptbalweth", decimals: 18 },
    { address: "0x358bd0d980e031e23eba9aa793926857703783bd", symbol: "aAmmBptWBTCWETH", coingeckoId: "aave-amm-bptwbtcweth", decimals: 18 },
    { address: "0x79be75ffc64dd58e66787e4eae470c8a1fd08ba4", symbol: "aAmmDAI", coingeckoId: "aave-amm-dai", decimals: 18 },
    { address: "0xe59d2ff6995a926a574390824a657eed36801e55", symbol: "aammuniaaveweth", coingeckoId: "aave-amm-uniaaveweth", decimals: 18 },
    { address: "0xa1b0edf4460cc4d8bfaa18ed871bff15e5b57eb4", symbol: "aAmmUniBATWETH", coingeckoId: "aave-amm-unibatweth", decimals: 18 },
    { address: "0x0ea20e7ffb006d4cfe84df2f72d8c7bd89247db0", symbol: "aAmmUniCRVWETH", coingeckoId: "aave-amm-unicrvweth", decimals: 18 },
    { address: "0xe340b25fe32b1011616bb8ec495a4d503e322177", symbol: "aAmmUniDAIUSDC", coingeckoId: "aave-amm-unidaiusdc", decimals: 18 },
    { address: "0x9303eabc860a743aabcc3a1629014cabcc3f8d36", symbol: "aammunidaiweth", coingeckoId: "aave-amm-unidaiweth", decimals: 18 },
    { address: "0xb8db81b84d30e2387de0ff330420a4aaa6688134", symbol: "aAmmUniLINKWETH", coingeckoId: "aave-amm-unilinkweth", decimals: 18 },
    { address: "0x370adc71f67f581158dc56f539df5f399128ddf9", symbol: "aAmmUniMKRWETH", coingeckoId: "aave-amm-unimkrweth", decimals: 18 },
    { address: "0xa9e201a4e269d6cd5e9f0fcbcb78520cf815878b", symbol: "aAmmUniRENWETH", coingeckoId: "aave-amm-unirenweth", decimals: 18 },
    { address: "0x38e491a71291cd43e8de63b7253e482622184894", symbol: "aAmmUniSNXWETH", coingeckoId: "aave-amm-unisnxweth", decimals: 18 },
    { address: "0x3d26dcd840fcc8e4b2193ace8a092e4a65832f9f", symbol: "aAmmUniUNIWETH", coingeckoId: "aave-amm-uniuniweth", decimals: 18 },
    { address: "0x391e86e2c002c70dee155eaceb88f7a3c38f5976", symbol: "aAmmUniUSDCWETH", coingeckoId: "aave-amm-uniusdcweth", decimals: 18 },
    { address: "0x2365a4890ed8965e564b7e2d27c38ba67fec4c6f", symbol: "aAmmUniWBTCUSDC", coingeckoId: "aave-amm-uniwbtcusdc", decimals: 18 },
    { address: "0xc58f53a8adff2fb4eb16ed56635772075e2ee123", symbol: "aammuniwbtcweth", coingeckoId: "aave-amm-uniwbtcweth", decimals: 18 },
    { address: "0x5394794be8b6ed5572fcd6b27103f46b5f390e8f", symbol: "aAmmUniYFIWETH", coingeckoId: "aave-amm-uniyfiweth", decimals: 18 },
    { address: "0xd24946147829deaa935be2ad85a3291dbf109c80", symbol: "aAmmUSDC", coingeckoId: "aave-amm-usdc", decimals: 6 },
    { address: "0x17a79792fe6fe5c95dfe95fe3fcee3caf4fe4cb7", symbol: "aAmmUSDT", coingeckoId: "aave-amm-usdt", decimals: 6 },
    { address: "0x13b2f6928d7204328b0e8e4bcd0379aa06ea21fa", symbol: "aAmmWBTC", coingeckoId: "aave-amm-wbtc", decimals: 8 },
    { address: "0xf9fb4ad91812b704ba883b11d2b576e890a6730a", symbol: "aAmmWETH", coingeckoId: "aave-amm-weth", decimals: 18 },
    { address: "0x272f97b7a56a387ae942350bbc7df5700f8a4576", symbol: "abal", coingeckoId: "aave-bal", decimals: 18 },
    { address: "0x41a08648c3766f9f9d85598ff102a08f4ef84f84", symbol: "abpt", coingeckoId: "aave-balancer-pool-token", decimals: 18 },
    { address: "0x05ec93c0365baaeabf7aeffb0972ea7ecdd39cf1", symbol: "abat", coingeckoId: "aave-bat", decimals: 18 },
    { address: "0xa361718326c15715591c299427c62086f69923d9", symbol: "abusd", coingeckoId: "aave-busd", decimals: 18 },
    { address: "0x6ee0f7bb50a54ab5253da0667b0dc2ee526c30a8", symbol: "abusd", coingeckoId: "aave-busd-v1", decimals: 18 },
    { address: "0x8dae6cb04688c62d939ed9b68d32bc62e49970b1", symbol: "aCRV", coingeckoId: "aave-crv", decimals: 18 },
    { address: "0x028171bca77440897b824ca71d1c56cac55b68a3", symbol: "adai", coingeckoId: "aave-dai", decimals: 18 },
    { address: "0xfc1e690f61efd961294b3e1ce3313fbd8aa4f85d", symbol: "adai", coingeckoId: "aave-dai-v1", decimals: 18 },
    { address: "0xac6df26a590f08dcc95d5a4705ae8abbc88509ef", symbol: "aenj", coingeckoId: "aave-enj", decimals: 18 },
    { address: "0x712db54daa836b53ef1ecbb9c6ba3b9efb073f40", symbol: "aenj", coingeckoId: "aave-enj-v1", decimals: 18 },
    { address: "0x3a3a65aab0dd2a17e3f1947ba16138cd37d08c04", symbol: "aeth", coingeckoId: "aave-eth-v1", decimals: 18 },
    { address: "0xd37ee7e4f452c6638c96536e68090de8cbcdb583", symbol: "agusd", coingeckoId: "aave-gusd", decimals: 2 },
    { address: "0x1e6bb68acec8fefbd87d192be09bb274170a0548", symbol: "aampl", coingeckoId: "aave-interest-bearing-ampl", decimals: 9 },
    { address: "0x39c6b3e42d6a679d7d776778fe880bc9487c2eda", symbol: "aknc", coingeckoId: "aave-knc", decimals: 18 },
    { address: "0xa06bc25b5805d5f8d82847d191cb4af5a3e873e0", symbol: "alink", coingeckoId: "aave-link", decimals: 18 },
    { address: "0xa64bd6c70cb9051f6a9ba1f163fdc07e0dfb5f84", symbol: "alink", coingeckoId: "aave-link-v1", decimals: 18 },
    { address: "0xa685a61171bb30d4072b338c80cb7b2c865c873e", symbol: "amana", coingeckoId: "aave-mana", decimals: 18 },
    { address: "0x6fce4a401b6b80ace52baaefe4421bd188e76f6f", symbol: "amana", coingeckoId: "aave-mana-v1", decimals: 18 },
    { address: "0xc713e5e149d5d0715dcd1c156a020976e7e56b88", symbol: "amkr", coingeckoId: "aave-mkr", decimals: 18 },
    { address: "0x7deb5e830be29f91e298ba5ff1356bb7f8146998", symbol: "amkr", coingeckoId: "aave-mkr-v1", decimals: 18 },
    { address: "0xc9bc48c72154ef3e5425641a3c747242112a46af", symbol: "arai", coingeckoId: "aave-rai", decimals: 18 },
    { address: "0xcc12abe4ff81c9378d670de1b57f8e0dd228d77a", symbol: "aren", coingeckoId: "aave-ren", decimals: 18 },
    { address: "0x69948cc03f478b95283f7dbf1ce764d0fc7ec54c", symbol: "aren", coingeckoId: "aave-ren-v1", decimals: 18 },
    { address: "0x35f6b052c598d933d69a4eec4d04c73a191fe6c2", symbol: "asnx", coingeckoId: "aave-snx", decimals: 18 },
    { address: "0x328c4c80bc7aca0834db37e6600a6c49e12da4de", symbol: "asnx", coingeckoId: "aave-snx-v1", decimals: 18 },
    { address: "0x6c5024cd4f8a59110119c56f8933403a539555eb", symbol: "asusd", coingeckoId: "aave-susd", decimals: 18 },
    { address: "0x625ae63000f46200499120b906716420bd059240", symbol: "asusd", coingeckoId: "aave-susd-v1", decimals: 18 },
    { address: "0x101cc05f4a51c0319f570d5e146a8c625198e636", symbol: "atusd", coingeckoId: "aave-tusd", decimals: 18 },
    { address: "0x4da9b813057d04baef4e5800e36083717b4a0341", symbol: "atusd", coingeckoId: "aave-tusd-v1", decimals: 18 },
    { address: "0xb9d7cb55f463405cdfbe4e90a6d2df01c2b92bf1", symbol: "auni", coingeckoId: "aave-uni", decimals: 18 },
    { address: "0xbcca60bb61934080951369a648fb03df4f96263c", symbol: "ausdc", coingeckoId: "aave-usdc", decimals: 6 },
    { address: "0x3ed3b47dd13ec9a98b44e6204a523e766b225811", symbol: "ausdt", coingeckoId: "aave-usdt", decimals: 6 },
    { address: "0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656", symbol: "awbtc", coingeckoId: "aave-wbtc", decimals: 8 },
    { address: "0xfc4b8ed459e00e5400be803a9bb3954234fd50e3", symbol: "awbtc", coingeckoId: "aave-wbtc-v1", decimals: 8 },
    { address: "0x030ba81f1c18d280636f32af80b9aad02cf0854e", symbol: "aweth", coingeckoId: "aave-weth", decimals: 18 },
    { address: "0xf256cc7847e919fac9b808cc216cac87ccf2f47a", symbol: "aXSUSHI", coingeckoId: "aave-xsushi", decimals: 18 },
    { address: "0x5165d24277cd063f5ac44efd447b27025e888f37", symbol: "aYFI", coingeckoId: "aave-yfi", decimals: 18 },
    { address: "0xdf7ff54aacacbff42dfe29dd6144a69b629f8c9e", symbol: "azrx", coingeckoId: "aave-zrx", decimals: 18 },
    { address: "0x6fb0855c404e09c47c3fbca25f08d4e41f9f062f", symbol: "azrx", coingeckoId: "aave-zrx-v1", decimals: 18 },
    { address: "0x12e51e77daaa58aa0e9247db7510ea4b46f9bead", symbol: "ayfi", coingeckoId: "ayfi-v1", decimals: 18 },
    { address: "0x80fb784b7ed66730e8b1dbd9820afd29931aab03", symbol: "lend", coingeckoId: "ethlend", decimals: 18 },
    { address: "0x57ab1ec28d129707052df4df418d58a2d46d5f51", symbol: "susd", coingeckoId: "nusd", decimals: 18 },
    { address: "0x8fcb1783bf4b71a51f702af0c266729c4592204a", symbol: "ot-ausdc-29dec2022", coingeckoId: "ot-aave-interest-bearing-usdc", decimals: 6 },
    { address: "0xd2df355c19471c8bd7d8a3aa27ff4e26a21b4076", symbol: "saave", coingeckoId: "saave", decimals: 18 },
    { address: "0xa1116930326d21fb917d5a27f1e9943a9595fb47", symbol: "stkabpt", coingeckoId: "staked-aave-balancer-pool-token", decimals: 18 },
    { address: "0x30c2a84aed6db30e31cf4d7059b1836c12c68068", symbol: "ugotchi", coingeckoId: "unicly-aavegotchi-astronauts-collection", decimals: 18 },
    { address: "0x80dc468671316e50d4e9023d3db38d3105c1c146", symbol: "xaavea", coingeckoId: "xaavea", decimals: 18 },
    { address: "0x704de5696df237c5b9ba0de9ba7e0c63da8ea0df", symbol: "xaaveb", coingeckoId: "xaaveb", decimals: 18 },
    { address: "0x16de59092dae5ccf4a1e6439d611fd0653f0bd01", symbol: "yDAI", coingeckoId: null, decimals: 18 }
  ],
  "binance-smart-chain": [
    { address: "0x0000000000000000000000000000000000000000", symbol: "BNB", coingeckoId: null, decimals: 18 },
    { address: "0x6bff4fb161347ad7de4a625ae5aa3a1ca7077819", symbol: "ADX", coingeckoId: "adex", decimals: 18 },
    { address: "0x2170ed0880ac9a755fd29b2688956bd959f933f8", symbol: "WETH", coingeckoId: "weth", decimals: 18 },
    { address: "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", symbol: "BTCB", coingeckoId: "bitcoin-bep2", decimals: 18 },
    { address: "0x947950bcc74888a40ffa2593c5798f11fc9124c4", symbol: "SUSHI", coingeckoId: "sushi", decimals: 18 },
    { address: "0xe9e7cea3dedca5984780bafc599bd69add087d56", symbol: "BUSD", coingeckoId: "binance-usd", decimals: 18 },
    { address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", symbol: "USDC", coingeckoId: "usd-coin", decimals: 18 },
    { address: "0xcc42724c6683b7e57334c4e856f4c9965ed682bd", symbol: "MATIC", coingeckoId: "matic-network", decimals: 18 },
    { address: "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd", symbol: "LINK", coingeckoId: "chainlink", decimals: 18 },
    { address: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", symbol: "DAI", coingeckoId: "dai", decimals: 18 },
    { address: "0x0eb3a705fc54725037cc9e008bdede697f62f335", symbol: "ATOM", coingeckoId: "cosmos", decimals: 18 },
    { address: "0x8595f9da7b868b1822194faed312235e43007b49", symbol: "BTT", coingeckoId: "bittorrent-2", decimals: 18 },
    { address: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", symbol: "WBNB", coingeckoId: "wbnb", decimals: 18 },
    { address: "0xad29abb318791d579433d831ed122afeaf29dcfe", symbol: "FTM", coingeckoId: "fantom", decimals: 18 },
    { address: "0x111111111117dc0aa78b770fa6a738034120c302", symbol: "1INCH", coingeckoId: "1inch", decimals: 18 },
    { address: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", symbol: "CAKE", coingeckoId: "pancakeswap-token", decimals: 18 },
    { address: "0x7ad7242a99f21aa543f9650a56d141c57e4f6081", symbol: "JADE", coingeckoId: "jade-protocol", decimals: 9 },
    { address: "0x3203c9e46ca618c8c1ce5dc67e7e9d75f5da2377", symbol: "MBOX", coingeckoId: "mobox", decimals: 18 },
    { address: "0x12bb890508c125661e03b09ec06e404bc9289040", symbol: "RACA", coingeckoId: "radio-caca", decimals: 18 },
    { address: "0xd41fdb03ba84762dd66a0af1a6c8540ff1ba5dfb", symbol: "SFP", coingeckoId: "safepal", decimals: 18 },
    { address: "0x47bead2563dcbf3bf2c9407fea4dc236faba485a", symbol: "SXP", coingeckoId: "swipe", decimals: 18 },
    { address: "0x728c5bac3c3e370e372fc4671f9ef6916b814d8b", symbol: "UNFI", coingeckoId: "unifi-protocol-dao", decimals: 18 },
    { address: "0xd40bedb44c081d2935eeba6ef5a3c8a31a1bbe13", symbol: "HERO", coingeckoId: "metahero", decimals: 18 },
    { address: "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40", symbol: "FRAX", coingeckoId: "frax", decimals: 18 },
    { address: "0x857b222fc79e1cbbf8ca5f78cb133d1b7cf34bbd", symbol: "LTO", coingeckoId: "lto-network", decimals: 18 },
    { address: "0xe02df9e3e622debdd69fb838bb799e3f168902c5", symbol: "BAKE", coingeckoId: "bakerytoken", decimals: 18 },
    { address: "0x935a544bf5816e3a7c13db2efe3009ffda0acda2", symbol: "BLZ", coingeckoId: "bluzelle", decimals: 18 },
    { address: "0xaec945e04baf28b135fa7c640f624f8d90f1c3a6", symbol: "C98", coingeckoId: "coin98", decimals: 18 },
    { address: "0xdaacb0ab6fb34d24e8a67bfa14bf4d95d4c7af92", symbol: "PNT", coingeckoId: "pnetwork", decimals: 18 },
    { address: "0xae9269f27437f0fcbc232d39ec814844a51d6b8f", symbol: "BURGER", coingeckoId: "burger-swap", decimals: 18 },
    { address: "0x0e37d70b51ffa2b98b4d34a5712c5291115464e3", symbol: "IQ", coingeckoId: "everipedia", decimals: 18 },
    { address: "0xa2b726b1145a4773f68593cf171187d8ebe4d495", symbol: "INJ", coingeckoId: "injective-protocol", decimals: 18 },
    { address: "0xbe1a001fe942f96eea22ba08783140b9dcc09d28", symbol: "BETA", coingeckoId: "beta-finance", decimals: 18 },
    { address: "0x00e1656e45f18ec6747f5a8496fd39b50b38396d", symbol: "BCOIN", coingeckoId: "bomber-coin", decimals: 18 },
    { address: "0x4b0f1812e5df2a09796481ff14017e6005508003", symbol: "TWT", coingeckoId: "trust-wallet-token", decimals: 18 },
    { address: "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63", symbol: "XVS", coingeckoId: "venus", decimals: 18 },
    { address: "0x50332bdca94673f33401776365b66cc4e81ac81d", symbol: "CCAR", coingeckoId: "cryptocars", decimals: 18 },
    { address: "0xcd1faff6e578fa5cac469d2418c95671ba1a62fe", symbol: "XTM", coingeckoId: "torum", decimals: 18 },
    { address: "0x2963dcc52549573bbfbe355674724528532c0867", symbol: "PEX", coingeckoId: "pexcoin", decimals: 18 },
    { address: "0x3fda9383a84c05ec8f7630fe10adf1fac13241cc", symbol: "DEGO", coingeckoId: "dego-finance", decimals: 18 },
    { address: "0xe17fbdf671f3cce0f354cacbd27e03f4245a3ffe", symbol: "RIFI", coingeckoId: "rikkei-finance", decimals: 18 },
    { address: "0x0a2046c7faa5a5f2b38c0599deb4310ab781cc83", symbol: "META", coingeckoId: "metaversepro", decimals: 9 },
    { address: "0xc2a605a31bf67a5af81cf6e39af79a62d8462717", symbol: "RPS", coingeckoId: "rps-league", decimals: 18 },
    { address: "0xa1faa113cbe53436df28ff0aee54275c13b40975", symbol: "ALPHA", coingeckoId: "alpha-finance", decimals: 18 },
    { address: "0x9ba6a67a6f3b21705a46b380a1b97373a33da311", symbol: "FEAR", coingeckoId: "fear", decimals: 18 },
    { address: "0x8850d2c68c632e3b258e612abaa8fada7e6958e5", symbol: "PIG", coingeckoId: "pig-finance", decimals: 9 },
    { address: "0x0a3a21356793b49154fd3bbe91cbc2a16c0457f5", symbol: "RFOX", coingeckoId: "redfox-labs-2", decimals: 18 },
    { address: "0x6679eb24f59dfe111864aec72b443d1da666b360", symbol: "ARV", coingeckoId: "ariva", decimals: 8 },
    { address: "0x87230146e138d3f296a9a77e497a2a83012e9bc5", symbol: "SQUID", coingeckoId: "squid-game", decimals: 18 }
  ],
  avalanche: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "AVAX", coingeckoId: null, decimals: 18 },
    { address: "0x63a72806098bd3d9520cc43356dd78afe5d386d9", symbol: "AAVE", coingeckoId: "aave", decimals: 18 },
    { address: "0x37b608519f91f70f2eeb0e5ed9af4061722e4f76", symbol: "SUSHI", coingeckoId: "sushi", decimals: 18 },
    { address: "0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664", symbol: "USDC", coingeckoId: "usd-coin", decimals: 6 },
    { address: "0x264c1383ea520f73dd837f915ef3a732e204a493", symbol: "BNB", coingeckoId: "binancecoin", decimals: 18 },
    { address: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab", symbol: "WETH", coingeckoId: "weth", decimals: 18 },
    { address: "0x5947bb275c521040051d82396192181b413227a3", symbol: "LINK", coingeckoId: "chainlink", decimals: 18 },
    { address: "0xd586e7f844cea2f87f50152665bcbc2c279d8d70", symbol: "DAI", coingeckoId: "dai", decimals: 18 },
    { address: "0xd501281565bf7789224523144fe5d98e8b28f267", symbol: "1INCH", coingeckoId: "1inch", decimals: 18 },
    { address: "0x1c20e891bab6b1727d14da358fae2984ed9b59eb", symbol: "TUSD", coingeckoId: "true-usd", decimals: 18 },
    { address: "0xb54f16fb19478766a268f172c9480f8da1a7c9c3", symbol: "TIME", coingeckoId: "wonderland", decimals: 9 },
    { address: "0x88128fd4b259552a9a1d457f435a6527aab72d42", symbol: "MKR", coingeckoId: "maker", decimals: 18 },
    { address: "0xd24c2ad096400b6fbcd2ad8b24e7acbc21a1da64", symbol: "FRAX", coingeckoId: "frax", decimals: 18 },
    { address: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd", symbol: "JOE", coingeckoId: "joe", decimals: 18 },
    { address: "0x8729438eb15e2c8b576fcc6aecda6a148776c0f5", symbol: "QI", coingeckoId: "benqi", decimals: 18 },
    { address: "0xbd83010eb60f12112908774998f65761cf9f6f9a", symbol: "BOO", coingeckoId: "spookyswap", decimals: 18 },
    { address: "0xf2f7ce610a091b94d41d69f4ff1129434a82e2f0", symbol: "GG", coingeckoId: "galaxygoogle-dao", decimals: 9 },
    { address: "0x7d1232b90d3f809a54eeaeebc639c62df8a8942f", symbol: "SB", coingeckoId: "snowbank", decimals: 9 },
    { address: "0x564a341df6c126f90cf3ecb92120fd7190acb401", symbol: "TRYB", coingeckoId: "bilira", decimals: 6 },
    { address: "0x70b33ebc5544c12691d055b49762d0f8365d99fe", symbol: "PAPA", coingeckoId: "papa-dao", decimals: 9 },
    { address: "0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4", symbol: "XAVA", coingeckoId: "avalaunch", decimals: 18 },
    { address: "0x5684a087c739a2e845f4aaaabf4fbd261edc2be8", symbol: "LF", coingeckoId: "life-dao", decimals: 9 },
    { address: "0xed46443c18e38064523180fc364c6180b35803d3", symbol: "CROWN", coingeckoId: "midasdao", decimals: 9 },
    { address: "0x8ae8be25c23833e0a01aa200403e826f611f9cd2", symbol: "CRAFT", coingeckoId: "talecraft", decimals: 18 },
    { address: "0xec3492a2508ddf4fdc0cd76f31f340b30d1793e6", symbol: "CLY", coingeckoId: "colony", decimals: 18 },
    { address: "0x1f1e7c893855525b303f99bdf5c3c05be09ca251", symbol: "SYN", coingeckoId: "synapse-2", decimals: 18 },
    { address: "0x788ae3b5d153d49f8db649aacba1857f744b739e", symbol: "KITTY", coingeckoId: "kitty-finance", decimals: 18 },
    { address: "0x214db107654ff987ad859f34125307783fc8e387", symbol: "FXS", coingeckoId: "frax-share", decimals: 18 },
    { address: "0xb2a85c5ecea99187a977ac34303b80acbddfa208", symbol: "ROCO", coingeckoId: "roco-finance", decimals: 18 },
    { address: "0xad7476c49d3f82a144f4836aacb9b069c188b759", symbol: "SLD", coingeckoId: "soldiernodes", decimals: 18 },
    { address: "0x60781c2586d68229fde47564546784ab3faca982", symbol: "PNG", coingeckoId: "pangolin", decimals: 18 },
    { address: "0x094bfac9894d2a2a35771d0bd6d2447689190f32", symbol: "CAT", coingeckoId: "cat", decimals: 18 },
    { address: "0x8f47416cae600bccf9530e9f3aeaa06bdd1caa79", symbol: "THOR", coingeckoId: "thor", decimals: 18 },
    { address: "0x0ebd9537a25f56713e34c45b38f421a1e7191469", symbol: "OOE", coingeckoId: "openocean", decimals: 18 },
    { address: "0xa32608e873f9ddef944b24798db69d80bbb4d1ed", symbol: "CRA", coingeckoId: "crabada", decimals: 18 },
    { address: "0xf2cfc11093edb5a2dc7f49e70a3a3a9cd4f4fee4", symbol: "BRIG", coingeckoId: "brig-finance", decimals: 18 },
    { address: "0xc7b5d72c836e718cda8888eaf03707faef675079", symbol: "SWAP", coingeckoId: "trustswap", decimals: 18 },
    { address: "0xe896cdeaac9615145c0ca09c8cd5c25bced6384c", symbol: "PEFI", coingeckoId: "penguin-finance", decimals: 18 },
    { address: "0xdef1fac7bf08f173d286bbbdcbeeade695129840", symbol: "CERBY", coingeckoId: "cerby-token", decimals: 18 },
    { address: "0xd6070ae98b8069de6b494332d1a1a81b6179d960", symbol: "BIFI", coingeckoId: "beefy-finance", decimals: 18 },
    { address: "0x0755fa2f4aa6311e1d7c19990416c86f17d16f86", symbol: "ETHP", coingeckoId: "etherprint", decimals: 6 },
    { address: "0x7c08413cbf02202a1c13643db173f2694e0f73f0", symbol: "MAXI", coingeckoId: "maximizer", decimals: 9 },
    { address: "0xb27c8941a7df8958a1778c0259f76d1f8b711c35", symbol: "KLO", coingeckoId: "kalao", decimals: 18 },
    { address: "0x321e7092a180bb43555132ec53aaa65a5bf84251", symbol: "GOHM", coingeckoId: "governance-ohm", decimals: 18 },
    { address: "0x961c8c0b1aad0c0b10a51fef6a867e3091bcef17", symbol: "DYP", coingeckoId: "defi-yield-protocol", decimals: 18 },
    { address: "0xf6d46849db378ae01d93732585bec2c4480d1fd5", symbol: "FORT", coingeckoId: "fortressdao", decimals: 9 },
    { address: "0xb80323c7aa915cb960b19b5cca1d88a2132f7bd1", symbol: "NADO", coingeckoId: "tornadao", decimals: 9 },
    { address: "0xfb98b335551a418cd0737375a2ea0ded62ea213b", symbol: "PENDLE", coingeckoId: "pendle", decimals: 18 }
  ],
  polygon: [
    { address: "0x0000000000000000000000000000000000000000", symbol: "MATIC", coingeckoId: null, decimals: 18 },
    { address: "0xc8e36f0a44fbeca89fdd5970439cbe62eb4b5d03", symbol: "ADX", coingeckoId: "adex", decimals: 18 },
    { address: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174", symbol: "USDC", coingeckoId: "usd-coin", decimals: 6 },
    { address: "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", symbol: "BNB", coingeckoId: "binancecoin", decimals: 18 },
    { address: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", symbol: "WETH", coingeckoId: "weth", decimals: 18 },
    { address: "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39", symbol: "LINK", coingeckoId: "chainlink", decimals: 18 },
    { address: "0xc6d54d2f624bc83815b49d9c2203b1330b841ca0", symbol: "SAND", coingeckoId: "the-sandbox", decimals: 18 },
    { address: "0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a", symbol: "SUSHI", coingeckoId: "sushi", decimals: 18 },
    { address: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063", symbol: "DAI", coingeckoId: "dai", decimals: 18 },
    { address: "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4", symbol: "MANA", coingeckoId: "decentraland", decimals: 18 },
    { address: "0x172370d5cd63279efa6d502dab29171933a610af", symbol: "CRV", coingeckoId: "curve-dao-token", decimals: 18 },
    { address: "0x9c2c5fd7b07e95ee044ddeba0e97a665f142394f", symbol: "1INCH", coingeckoId: "1inch", decimals: 18 },
    { address: "0xd6df932a45c0f255f85145f286ea0b292b21c90b", symbol: "AAVE", coingeckoId: "aave", decimals: 18 },
    { address: "0x5fe2b58c013d7601147dcdd68c143a77499f5531", symbol: "GRT", coingeckoId: "the-graph", decimals: 18 },
    { address: "0x61299774020da444af134c82fa83e3810b309991", symbol: "RNDR", coingeckoId: "render-token", decimals: 18 },
    { address: "0x2b9e7ccdf0f4e5b24757c1e1a80e311e34cb10c7", symbol: "MASK", coingeckoId: "mask-network", decimals: 18 },
    { address: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7", symbol: "GHST", coingeckoId: "aavegotchi", decimals: 18 },
    { address: "0x9a71012b13ca4d3d0cdc72a177df3ef03b0e76a3", symbol: "BAL", coingeckoId: "balancer", decimals: 18 },
    { address: "0xa1428174f516f527fafdd146b883bb4428682737", symbol: "SUPER", coingeckoId: "superfarm", decimals: 18 },
    { address: "0x45c32fa6df82ead1e2ef74d17b76547eddfaff89", symbol: "FRAX", coingeckoId: "frax", decimals: 18 },
    { address: "0xe0339c80ffde91f3e20494df88d4206d86024cdf", symbol: "ELON", coingeckoId: "dogelon-mars", decimals: 18 },
    { address: "0xb9638272ad6998708de56bbc0a290a1de534a578", symbol: "IQ", coingeckoId: "everipedia", decimals: 18 },
    { address: "0xe1c42be9699ff4e11674819c1885d43bd92e9d15", symbol: "XTM", coingeckoId: "torum", decimals: 18 },
    { address: "0x1d2a0e5ec8e5bbdca5cb219e649b565d8e5c3360", symbol: "amAAVE", coingeckoId: "aave-polygon-aave", decimals: 18 },
    { address: "0x27f8d03b3a2196956ed754badc28d73be8830a6e", symbol: "amDAI", coingeckoId: "aave-polygon-dai", decimals: 18 },
    { address: "0x1a13f4ca1d028320a707d99520abfefca3998b7f", symbol: "amusdc", coingeckoId: "aave-polygon-usdc", decimals: 6 },
    { address: "0x60d55f02a771d515e077c9c2403a1ef324885cec", symbol: "amUSDT", coingeckoId: "aave-polygon-usdt", decimals: 6 },
    { address: "0x5c2ed810328349100a66b82b78a1791b101c9d61", symbol: "amWBTC", coingeckoId: "aave-polygon-wbtc", decimals: 8 },
    { address: "0x28424507fefb6f7f8e9d3860f56504e4e5f5f390", symbol: "amWETH", coingeckoId: "aave-polygon-weth", decimals: 18 },
    { address: "0x8df3aad3a84da6b69a4da8aec3ea40d9091b2ac4", symbol: "amWMATIC", coingeckoId: "aave-polygon-wmatic", decimals: 18 },
    { address: "0x823cd4264c1b951c9209ad0deaea9988fe8429bf", symbol: "maaave", coingeckoId: "matic-aave-aave", decimals: 18 },
    { address: "0xe0b22e0037b130a9f56bbb537684e6fa18192341", symbol: "madai", coingeckoId: "matic-aave-dai", decimals: 18 },
    { address: "0x98ea609569bd25119707451ef982b90e3eb719cd", symbol: "malink", coingeckoId: "matic-aave-link", decimals: 18 },
    { address: "0xf4b8888427b00d7caf21654408b7cba2ecf4ebd9", symbol: "matusd", coingeckoId: "matic-aave-tusd", decimals: 18 },
    { address: "0x8c8bdbe9cee455732525086264a4bf9cf821c498", symbol: "mauni", coingeckoId: "matic-aave-uni", decimals: 18 },
    { address: "0x9719d867a500ef117cc201206b8ab51e794d3f82", symbol: "mausdc", coingeckoId: "matic-aave-usdc", decimals: 6 },
    { address: "0xdae5f1590db13e3b40423b5b5c5fbf175515910b", symbol: "mausdt", coingeckoId: "matic-aave-usdt", decimals: 6 },
    { address: "0x20d3922b4a1a8560e1ac99fba4fade0c849e2142", symbol: "maweth", coingeckoId: "matic-aave-weth", decimals: 18 },
    { address: "0xe20f7d1f0ec39c4d5db01f53554f2ef54c71f613", symbol: "mayfi", coingeckoId: "matic-aave-yfi", decimals: 18 }
  ]
}

const dummyTokensData = {
  ethereum: [
    {
      "type": "base",
      "network": "ethereum",
      "address": "0xba100000625a3754423978a60c9317c58a424e3d",
      "decimals": 18,
      "symbol": "BAL",
      "price": 17.74,
      "balance": 356.8423079750322,
      "balanceRaw": "356842307975032204643",
      "balanceUSD": 6330.382543477071,
      "tokenImageUrl": "https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0xba100000625a3754423978a60c9317c58a424e3d.png"
    },
    {
      "type": "base",
      "network": "ethereum",
      "address": "0x24a6a37576377f63f194caa5f518a60f4511111", //0x24a6a37576377f63f194caa5f518a60f45b42921 is correct
      "decimals": 18,
      "symbol": "BANK",
      "price": 71.13,
      "balance": 10.95879253400511,
      "balanceRaw": "10958792534005109707",
      "balanceUSD": 779.4989129437834,
      "tokenImageUrl": "https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x24a6a37576377f63f194caa5f518a60f45b42921.png"
    },
    {
      "type": "base",
      "network": "ethereum",
      "address": "0x56d811088235f11c8920698a204a5010a788f4b3",
      "decimals": 18,
      "symbol": "BZRX",
      "price": 0.208666,
      "balance": 7633.812396440875,
      "balanceRaw": "7633812396440874978986",
      "balanceUSD": 1592.9170975157315,
      "tokenImageUrl": "https://storage.googleapis.com/zapper-fi-assets/tokens/ethereum/0x56d811088235f11c8920698a204a5010a788f4b3.png"
      }
  ],
  polygon: [
    { address: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270", symbol: "WMATIC", coingeckoId: null, decimals: 18 }
  ],
  'binance-smart-chain': [
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0x570a5d26f7765ecb712c0924e4de545b89fd43df",
      "decimals": 18,
      "symbol": "SOL",
      "price": 0,
      "balance": 2.72627904,
      "balanceRaw": "2726279040000000000",
      "balanceUSD": 0,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/56/0x570a5d26f7765ecb712c0924e4de545b89fd43df.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
      "decimals": 18,
      "symbol": "ETH",
      "price": 4021.91,
      "balance": 0.05632541,
      "balanceRaw": "56325410000000000",
      "balanceUSD": 226.5357297331,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/1/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
      "decimals": 18,
      "symbol": "UNI",
      "price": 14.82,
      "balance": 10.14716105,
      "balanceRaw": "10147161050000000000",
      "balanceUSD": 150.38092676099998,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/1/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0x43c934a845205f0b514417d757d7235b8f53f1b9",
      "decimals": 18,
      "symbol": "XLM",
      "price": 0,
      "balance": 500.47904793,
      "balanceRaw": "500479047930000000000",
      "balanceUSD": 0,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/56/0x43c934a845205f0b514417d757d7235b8f53f1b9.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0xcc42724c6683b7e57334c4e856f4c9965ed682bd",
      "decimals": 18,
      "symbol": "MATIC",
      "price": 2.31,
      "balance": 29.57817668,
      "balanceRaw": "29578176680000000000",
      "balanceUSD": 68.3255881308,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/1/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0x55d398326f99059ff775485246999027b3197956", //real 0x55d398326f99059ff775485246999027b3197955
      "decimals": 18,
      "symbol": "USDT",
      "price": 1,
      "balance": 111,
      "balanceRaw": "11100000000000000000",
      "balanceUSD": 111.00,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/1/0xdac17f958d2ee523a2206206994597c13d831ec7.png"
    },
    {
      "type": "base",
      "network": "binance-smart-chain",
      "address": "0x8595f9da7b868b1822194faed312235e43007b49",
      "decimals": 18,
      "symbol": "BTT",
      "price": 0.0026883,
      "balance": 6953.99665713,
      "balanceRaw": "6953996657130000000000",
      "balanceUSD": 18.69442921336258,
      "tokenImageUrl": "https://logos.covalenthq.com/tokens/56/0x8595f9da7b868b1822194faed312235e43007b49.png"
    }
  ]
}
const dummyExtraTokens = {
  ethereum: [
    { address: "0x4CF488387F035FF08c371515562CBa712f9015d4", symbol: "WPR", coingeckoId: null, decimals: 18 }
  ],
  polygon: [
    { address: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f", symbol: "USDT", coingeckoId: null, decimals: 6 }
  ]
}

function checkTokenList (list) {
  return list.filter(t => {
    return isAddress(t.address)
  })
}

export {
    call,
    tokenList,
    isErr,
    getErrMsg,
    dummyExtraTokens,
    dummyTokensData,
    checkTokenList,
    getTokenListBalance
}