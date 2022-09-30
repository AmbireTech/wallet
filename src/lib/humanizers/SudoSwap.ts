// TODO: add types
// @ts-nocheck

import {Interface} from 'ethers/lib/utils'
import {BigNumber} from 'ethers'

import {nativeToken, token} from 'lib/humanReadableTransactions'

const SudoSwapMapping = (humanizerInfo) => {

  // TODO check how to deal with jason.ambire
  humanizerInfo.abis.SudoSwapFactory = [{"inputs":[{"internalType":"contract LSSVMPairEnumerableETH","name":"_enumerableETHTemplate","type":"address"},{"internalType":"contract LSSVMPairMissingEnumerableETH","name":"_missingEnumerableETHTemplate","type":"address"},{"internalType":"contract LSSVMPairEnumerableERC20","name":"_enumerableERC20Template","type":"address"},{"internalType":"contract LSSVMPairMissingEnumerableERC20","name":"_missingEnumerableERC20Template","type":"address"},{"internalType":"address payable","name":"_protocolFeeRecipient","type":"address"},{"internalType":"uint256","name":"_protocolFeeMultiplier","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract ICurve","name":"bondingCurve","type":"address"},{"indexed":false,"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"BondingCurveStatusUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"target","type":"address"},{"indexed":false,"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"CallTargetStatusUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"poolAddress","type":"address"}],"name":"NFTDeposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"poolAddress","type":"address"}],"name":"NewPair","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMultiplier","type":"uint256"}],"name":"ProtocolFeeMultiplierUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"recipientAddress","type":"address"}],"name":"ProtocolFeeRecipientUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract LSSVMRouter","name":"router","type":"address"},{"indexed":false,"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"RouterStatusUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"poolAddress","type":"address"}],"name":"TokenDeposit","type":"event"},{"inputs":[{"internalType":"contract ICurve","name":"","type":"address"}],"name":"bondingCurveAllowed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"callAllowed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_protocolFeeMultiplier","type":"uint256"}],"name":"changeProtocolFeeMultiplier","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_protocolFeeRecipient","type":"address"}],"name":"changeProtocolFeeRecipient","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"contract ERC20","name":"token","type":"address"},{"internalType":"contract IERC721","name":"nft","type":"address"},{"internalType":"contract ICurve","name":"bondingCurve","type":"address"},{"internalType":"address payable","name":"assetRecipient","type":"address"},{"internalType":"enum LSSVMPair.PoolType","name":"poolType","type":"uint8"},{"internalType":"uint128","name":"delta","type":"uint128"},{"internalType":"uint96","name":"fee","type":"uint96"},{"internalType":"uint128","name":"spotPrice","type":"uint128"},{"internalType":"uint256[]","name":"initialNFTIDs","type":"uint256[]"},{"internalType":"uint256","name":"initialTokenBalance","type":"uint256"}],"internalType":"struct LSSVMPairFactory.CreateERC20PairParams","name":"params","type":"tuple"}],"name":"createPairERC20","outputs":[{"internalType":"contract LSSVMPairERC20","name":"pair","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"_nft","type":"address"},{"internalType":"contract ICurve","name":"_bondingCurve","type":"address"},{"internalType":"address payable","name":"_assetRecipient","type":"address"},{"internalType":"enum LSSVMPair.PoolType","name":"_poolType","type":"uint8"},{"internalType":"uint128","name":"_delta","type":"uint128"},{"internalType":"uint96","name":"_fee","type":"uint96"},{"internalType":"uint128","name":"_spotPrice","type":"uint128"},{"internalType":"uint256[]","name":"_initialNFTIDs","type":"uint256[]"}],"name":"createPairETH","outputs":[{"internalType":"contract LSSVMPairETH","name":"pair","type":"address"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"token","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"depositERC20","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"_nft","type":"address"},{"internalType":"uint256[]","name":"ids","type":"uint256[]"},{"internalType":"address","name":"recipient","type":"address"}],"name":"depositNFTs","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"enumerableERC20Template","outputs":[{"internalType":"contract LSSVMPairEnumerableERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"enumerableETHTemplate","outputs":[{"internalType":"contract LSSVMPairEnumerableETH","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"potentialPair","type":"address"},{"internalType":"enum ILSSVMPairFactoryLike.PairVariant","name":"variant","type":"uint8"}],"name":"isPair","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"missingEnumerableERC20Template","outputs":[{"internalType":"contract LSSVMPairMissingEnumerableERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"missingEnumerableETHTemplate","outputs":[{"internalType":"contract LSSVMPairMissingEnumerableETH","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"protocolFeeMultiplier","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"protocolFeeRecipient","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract LSSVMRouter","name":"","type":"address"}],"name":"routerStatus","outputs":[{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"bool","name":"wasEverAllowed","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ICurve","name":"bondingCurve","type":"address"},{"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"setBondingCurveAllowed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"target","type":"address"},{"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"setCallAllowed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract LSSVMRouter","name":"_router","type":"address"},{"internalType":"bool","name":"isAllowed","type":"bool"}],"name":"setRouterAllowed","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"token","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"withdrawERC20ProtocolFees","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawETHProtocolFees","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]
  humanizerInfo.abis.SudoSwapRouter = [{"inputs":[{"internalType":"contract ILSSVMPairFactoryLike","name":"_factory","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"factory","outputs":[{"internalType":"contract ILSSVMPairFactoryLike","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"contract ERC20","name":"token","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"enum ILSSVMPairFactoryLike.PairVariant","name":"variant","type":"uint8"}],"name":"pairTransferERC20From","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"contract IERC721","name":"nft","type":"address"},{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"enum ILSSVMPairFactoryLike.PairVariant","name":"variant","type":"uint8"}],"name":"pairTransferNFTFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapAny[]","name":"swapList","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"robustSwapERC20ForAnyNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecific[]","name":"swapList","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"robustSwapERC20ForSpecificNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecific[]","name":"tokenToNFTTrades","type":"tuple[]"},{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"minOutput","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecificForToken[]","name":"nftToTokenTrades","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address payable","name":"tokenRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"}],"internalType":"struct LSSVMRouter.RobustPairNFTsFoTokenAndTokenforNFTsTrade","name":"params","type":"tuple"}],"name":"robustSwapERC20ForSpecificNFTsAndNFTsToToken","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"},{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapAny[]","name":"swapList","type":"tuple[]"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"robustSwapETHForAnyNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecific[]","name":"swapList","type":"tuple[]"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"robustSwapETHForSpecificNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"maxCost","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecific[]","name":"tokenToNFTTrades","type":"tuple[]"},{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"minOutput","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecificForToken[]","name":"nftToTokenTrades","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address payable","name":"tokenRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"}],"internalType":"struct LSSVMRouter.RobustPairNFTsFoTokenAndTokenforNFTsTrade","name":"params","type":"tuple"}],"name":"robustSwapETHForSpecificNFTsAndNFTsToToken","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"},{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific","name":"swapInfo","type":"tuple"},{"internalType":"uint256","name":"minOutput","type":"uint256"}],"internalType":"struct LSSVMRouter.RobustPairSwapSpecificForToken[]","name":"swapList","type":"tuple[]"},{"internalType":"address payable","name":"tokenRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"robustSwapNFTsForToken","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny[]","name":"swapList","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapERC20ForAnyNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"swapList","type":"tuple[]"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapERC20ForSpecificNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny[]","name":"swapList","type":"tuple[]"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForAnyNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"swapList","type":"tuple[]"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForSpecificNFTs","outputs":[{"internalType":"uint256","name":"remainingValue","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"nftToTokenTrades","type":"tuple[]"},{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny[]","name":"tokenToNFTTrades","type":"tuple[]"}],"internalType":"struct LSSVMRouter.NFTsForAnyNFTsTrade","name":"trade","type":"tuple"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"uint256","name":"minOutput","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapNFTsForAnyNFTsThroughERC20","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"nftToTokenTrades","type":"tuple[]"},{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256","name":"numItems","type":"uint256"}],"internalType":"struct LSSVMRouter.PairSwapAny[]","name":"tokenToNFTTrades","type":"tuple[]"}],"internalType":"struct LSSVMRouter.NFTsForAnyNFTsTrade","name":"trade","type":"tuple"},{"internalType":"uint256","name":"minOutput","type":"uint256"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapNFTsForAnyNFTsThroughETH","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"nftToTokenTrades","type":"tuple[]"},{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"tokenToNFTTrades","type":"tuple[]"}],"internalType":"struct LSSVMRouter.NFTsForSpecificNFTsTrade","name":"trade","type":"tuple"},{"internalType":"uint256","name":"inputAmount","type":"uint256"},{"internalType":"uint256","name":"minOutput","type":"uint256"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapNFTsForSpecificNFTsThroughERC20","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"nftToTokenTrades","type":"tuple[]"},{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"tokenToNFTTrades","type":"tuple[]"}],"internalType":"struct LSSVMRouter.NFTsForSpecificNFTsTrade","name":"trade","type":"tuple"},{"internalType":"uint256","name":"minOutput","type":"uint256"},{"internalType":"address payable","name":"ethRecipient","type":"address"},{"internalType":"address","name":"nftRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapNFTsForSpecificNFTsThroughETH","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[{"components":[{"internalType":"contract LSSVMPair","name":"pair","type":"address"},{"internalType":"uint256[]","name":"nftIds","type":"uint256[]"}],"internalType":"struct LSSVMRouter.PairSwapSpecific[]","name":"swapList","type":"tuple[]"},{"internalType":"uint256","name":"minOutput","type":"uint256"},{"internalType":"address","name":"tokenRecipient","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapNFTsForToken","outputs":[{"internalType":"uint256","name":"outputAmount","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]

  const SudoSwapFactory = new Interface(humanizerInfo.abis.SudoSwapFactory)
  const SudoSwapRouter = new Interface(humanizerInfo.abis.SudoSwapRouter)

  return {
    [SudoSwapFactory.getSighash('createPairETH')]: (txn, network, {extended = false}) => {
      const {_nft, _spotPrice, _poolType, _initialNFTIDs} = SudoSwapFactory.parseTransaction(txn).args

      if (_poolType === 0) { // making collection offer

        const price = txn.value

        // the amount of nfts in the offer
        const nftPieces = price / _spotPrice

        const paymentToken = nativeToken(network, price, true)

        return !extended
          ? [`${_poolType} Make an offer of ${nftPieces} NFTs for ${_nft} for ${paymentToken.amount} ETH`]
          : [
            [
              'Make an offer',
              `of ${nftPieces} NFTs for`,
              {
                type: 'address',
                address: _nft
              },
              'for',
              {
                type: 'token',
                ...paymentToken
              }
            ]
          ]
      } else if (_poolType === 1) { // listing nft

        const paymentToken = nativeToken(network, _spotPrice, true)
        return !extended
          ? [`List NFT ${_nft} #${_initialNFTIDs.join(',')} for ${paymentToken.amount} ETH`]
          : [
            [
              'List NFT',
              {
                type: 'address',
                address: _nft,
              },
              `#${_initialNFTIDs.join(',')}`,
              'for',
              {
                type: 'token',
                ...paymentToken
              },
            ]
          ]
      }

    },
    [SudoSwapFactory.getSighash('createPairERC20')]: (txn, network, {extended = false}) => {
      const {params} = SudoSwapFactory.parseTransaction(txn).args
      const paymentToken = token(params.token, params.spotPrice, true)

      return !extended
        ? [`Make an offer for ${params.nft} #${params.initialNFTIDs.join(',')} for ${paymentToken.amount} ${paymentToken.symbol || 'Unknown token'}`]
        : [
          [
            'Make an offer',
            'for the NFT',
            {
              type: 'erc721',
              address: params.nft
            },
            'for',
            {
              type: 'token',
              ...paymentToken
            },
          ]
        ]
    },
    [SudoSwapFactory.getSighash('depositNFTs')]: (txn, network, {extended = false}) => {
      const {_nft, ids} = SudoSwapFactory.parseTransaction(txn).args
      const nfts = ids.map(id => ({address: _nft, id}))
      return !extended
        ? [`Deposit NFT ${_nft} #${ids.join(',')}`]
        : [
          [
            'Deposit NFT',
            {
              type: 'erc721',
              list: nfts
            },
          ]
        ]
    },

    [SudoSwapRouter.getSighash('swapETHForSpecificNFTs')]: (txn, network, {extended = false}) => {
      const {swapList} = SudoSwapRouter.parseTransaction(txn).args
      const price = txn.value
      const paymentToken = nativeToken(network, price, true)

      if (!extended) return [`Buy NFT from vaults ${swapList.map(i => i[0] + ' #' + i[1]).join(',')} for ${paymentToken.amount} ETH`]

      let extendedResult = [
        'Buy NFT',
        'from vaults',
      ]

      swapList.forEach(i => {
        extendedResult.push({
          type: 'address',
          address: i[0]
        })
        extendedResult.push(' #' + i[1])
      })

      extendedResult.push('for')
      extendedResult.push({
        type: 'token',
        ...paymentToken
      })

      return [extendedResult]
    },
    [SudoSwapRouter.getSighash('robustSwapETHForSpecificNFTs')]: (txn, network, {extended = false}) => {
      const {swapList} = SudoSwapRouter.parseTransaction(txn).args

      const maxCost = swapList.reduce((prev, cur) => prev.add(cur.maxCost), BigNumber.from(0))
      const price = maxCost.toString()
      const paymentToken = nativeToken(network, price, true)

      const vaults = swapList.map(sl => {
        return {
          address: sl.swapInfo.pair,
          ids: sl.swapInfo.nftIds
        }
      })

      if (!extended) {
        return [`Buy NFT from vault ${vaults.map(v => v.address + ' #' + v.ids.join(',')).join(', ')} for ${paymentToken.amount} ETH`]
      }

      let extendedResult = [
        'Buy NFT',
        'from vault'
      ]

      vaults.forEach(v => {
        extendedResult.push({
          type: 'address',
          address: v.address
        })
        extendedResult.push('#' + v.ids.join(','))
      })

      return [extendedResult]
    },
    [SudoSwapRouter.getSighash('swapNFTsForToken')]: (txn, network, {extended = false}) => {
      const {swapList, minOutput} = SudoSwapRouter.parseTransaction(txn).args

      const vaults = swapList.map(sl => ({
          address: sl.pair,
          ids: sl.nftIds
        })
      )

      const paymentToken = nativeToken(network, minOutput, true)

      if (!extended) {
        return [`Sell NFT to vault ${vaults.map(v => v.address + ' #' + v.ids.join(',')).join(', ')} for ${paymentToken.amount} ETH`]
      }

      let extendedResult = [
        'Sell NFT',
        'to vault'
      ]

      vaults.forEach(v => {
        extendedResult.push({
          type: 'address',
          address: v.address
        })
        extendedResult.push('#' + v.ids.join(','))
      })

      extendedResult.push('for')
      extendedResult.push({
        type: 'token',
        ...paymentToken
      })

      return [extendedResult]
    },
    [SudoSwapRouter.getSighash('swapERC20ForAnyNFTs')]: (txn, network, {extended = false}) => {
      const {swapList, inputAmount} = SudoSwapRouter.parseTransaction(txn).args

      const totalNumItems = swapList.reduce((prev, cur) => prev.add(cur.numItems), BigNumber.from(0))

      const pairs = swapList.map(sl => sl.pair)

      const paymentToken = token('unknown', inputAmount, true)

      if (!extended) return [`Buy ${totalNumItems} NFT from vaults ${pairs.join(',')} for ${paymentToken.amount} units of tokens`]

      let extendedResult = [
        `Buy any ${totalNumItems} NFT`,
        'from vaults',
      ]

      pairs.forEach(p => extendedResult.push(p))

      extendedResult.push('for')

      extendedResult.push({
        type: 'token',
        ...paymentToken
      })

      return [extendedResult]

    },
  }
}

export default SudoSwapMapping
