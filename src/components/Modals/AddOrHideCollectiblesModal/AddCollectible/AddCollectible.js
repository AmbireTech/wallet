import { MdOutlineRemove } from 'react-icons/md'
import ERC1155Abi from 'ambire-common/src/constants/abis/ERC1155Abi'
import ERC721Abi from 'ambire-common/src/constants/abis/ERC721Abi'

import { useState } from 'react'
import { Contract } from 'ethers'

import networks from 'consts/networks'
import { getProvider } from 'ambire-common/src/services/provider'
import { VELCRO_API_ENDPOINT } from 'config'
import { fetchGet } from 'lib/fetch'

import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { Button, Loading, TextInput } from 'components/common'

import styles from './AddCollectible.module.scss'

const Collectible = ({ button, name, image }) => (
  <div className={styles.collectible}>
    <div className={styles.info}>
      <div className={styles.iconWrapper}>
        <img src={image} alt="" className={styles.icon} />
      </div>
      <h3 className={styles.name}>
        { name }
      </h3>
    </div>
    { button }
  </div>
)


const AddCollectible = ({ network, account, portfolio, handleUri }) => {
  const { addToast } = useToasts()
  const { hideModal } = useModals()

  const { extraCollectibles, onAddExtraCollectible, onRemoveExtraCollectible, } = portfolio

  const [loading, setLoading] = useState(false)
  const [tokenDetails, setTokenDetails] = useState(null)
  const [showError, setShowError] = useState(false)
  const disabled = showError || !tokenDetails || !(tokenDetails.tokenId && tokenDetails.collectionAddress)

  const onInput = async address => {
    setTokenDetails(null)
    setShowError(false)
    setTokenDetails({ collectionAddress: address })

  }

  const fetchFromVelcroMetaData = async (collectionAddress, tokenId, balance) => {
    try {
      const { success, collection, image, name, message } = await fetchGet(
          `${VELCRO_API_ENDPOINT}/nftmeta/${collectionAddress}/${tokenId}?network=${network?.id}`
          )                
      if (!success) throw new Error(message)
      const networkDetails = networks.find(({ id }) => id === network.id)
      if (!networkDetails) throw new Error('This network is not supported')

      setTokenDetails(metadata => ({
          ...metadata,
          type: 'nft',
          tokenId,
          network: network.id,
          image,
          name,
          address: collectionAddress,
          collectionName: collection,
          balance,
          balanceUSD: 0,
          collection,
          assets: [{ tokenId, data: { image, name} }],
      })) 
      
      setLoading(false)
    } catch(e) {
      console.error(e)
      setLoading(false)

      addToast(`Collectible error: ${e.message || e}`, { error: true })
    }
  }

  const onIdInput = async (tokenId) => {
    setTokenDetails(prev => ({...prev, tokenId }))
    if (!tokenId) return

    setLoading(true)

    const { collectionAddress } = tokenDetails
    const provider = getProvider(network.id)

    try {
      const token = new Contract(collectionAddress, ERC1155Abi, provider)

      // GET Balance of collectible
      const balance = Number(await token.balanceOf(account,tokenId))
      const metaURI = await token.uri(tokenId)
      
      if (!balance) {
        addToast(`You don't have balance of this collectible to add in your wallet`)
        setTokenDetails(null)
        setLoading(false)
        return
      }
      try {
        let json = {}
        const response = await fetch(metaURI)
        json = await response.json()

        setTokenDetails(metadata => ({
          ...metadata,
          ...json,
          type: 'nft',
          network: network.id,
          tokenId,
          address: collectionAddress,
          balance,
          balanceUSD: 0,
          collection: json?.collection || "unknown",
          collectionName: json?.collection || "unknown",
        })) 
      
        setLoading(false)
      } catch (err) {
        // Meta link is not valid
        console.log('fetch from velcro nft meta data')
        fetchFromVelcroMetaData(collectionAddress, tokenId, balance)
      }
    } catch (e) {
      const contract = new Contract(collectionAddress, ERC721Abi, provider)

      try {
        let [collection, address, maybeUri1, maybeUri2, balance] = await Promise.all([
          contract.name(),
          contract.ownerOf(tokenId),
          contract.tokenURI(tokenId).then(uri => ({ uri })).catch(err => ({ err })),
          contract.uri(tokenId).then(uri => ({ uri })).catch(err => ({ err })),
          contract.balanceOf(account)
        ])
        // debugger
        balance = Number(balance)

        if (!balance) {
          addToast(`You don't have balance of this collectible to add in your wallet`)
          setTokenDetails(null)
          setLoading(false)
          return
        }
        const uri = maybeUri1.uri || maybeUri2.uri
        if (!uri) throw maybeUri1.err || maybeUri2.err

        let json = {}

        if (uri.startsWith('data:application/json')) {
          json = JSON.parse(uri.replace('data:application/json;utf8,', ''))
        } else {
          const jsonUrl = handleUri(uri)
          const response = await fetch(jsonUrl)
          json = await response.json()
        }
        setTokenDetails(metadata => ({
          ...metadata,
          network: network.id,
          type: 'nft',
          tokenId,
          owner: address,
          balance: 1,
          balanceUSD: 0,
          collection,
          name: collection,
          collectionName: collection,
          image: json?.image
        })) 
        setLoading(false)

      } catch (err) {
        console.log({err})
        addToast(`Error getting collectible data`, { error: true })
        setLoading(false)
      }
    
    }
  }

  const addCollectible = async () => {
    onAddExtraCollectible({
      ...tokenDetails,
      account,
      network: network.id,
      assets: [ { tokenId: tokenDetails.tokenId, data: { name: tokenDetails?.name, image: tokenDetails.image }} ],
    })
    hideModal()
  }

  const removeCollectible = (address, tokenId) => {
    onRemoveExtraCollectible(address, tokenId)
    hideModal()
  }

  console.log(extraCollectibles)

  return (
    <div className={styles.wrapper}>
      <TextInput
        small
        label="Collectible Address"
        placeholder="0x..."
        onInput={value => onInput(value)}
        className={styles.addressInput}
      />
      <TextInput
        small
        label="Collectible Id"
        placeholder=""
        value={tokenDetails?.tokenId || ''}
        onInput={value => onIdInput(value)}
        className={styles.addressInput}
      />
      {
        loading ? <Loading/> : (!showError && tokenDetails && tokenDetails.tokenId && tokenDetails.image ) ? <Collectible
          key={tokenDetails.tokenId}
          name={tokenDetails.name}
          image={handleUri(tokenDetails.image)}
        /> : null
      }
      <Button primaryGradient className={styles.addButton} disabled={disabled} onClick={addCollectible}>Add Collectible</Button>
      <div className={styles.extraTokensList}>
        {extraCollectibles.map((collectible) => (collectible.assets || []).map((asset) => (
          <Collectible
            key={collectible.address}
            name={asset.data.name}
            image={handleUri(asset.data.image)}
            button={<div className={styles.actions}>
              <Button mini clear onClick={() => removeCollectible(collectible.address, asset.tokenId)}>
                <MdOutlineRemove />
              </Button>
            </div>}
            handleUri={handleUri}
          />
        )))}
      </div>
    </div>
  )
}

export default AddCollectible