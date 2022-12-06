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

  const { onAddExtraCollectible, onRemoveExtraToken } = portfolio
  const extraCollectibles = []
  const [loading, setLoading] = useState(false)
  const [tokenDetails, setTokenDetails] = useState(null)
  const [showError, setShowError] = useState(false)
  const disabled = !tokenDetails || !(tokenDetails.tokenId && tokenDetails.collectionAddress)

  const onInput = async address => {
    setTokenDetails(null)
    setShowError(false)
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
      
      try {
        let json = {}
        const response = await fetch(metaURI)
        json = await response.json()

        setTokenDetails(metadata => ({
          ...metadata,
          ...json,
          type: 'nft',
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
      console.log({e})
      console.log('fetch from velcro nft meta data without balance')
      fetchFromVelcroMetaData(collectionAddress, tokenId, 0)
    }
  }

  const addCollectible = async () => {
    // onAddExtraCollectible({...tokenDetails, address: account, network })
    // hideModal()
  }

  const removeCollectible = address => {
    onRemoveExtraToken(address)
    hideModal()
  }

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
        loading ? <Loading/> : (!showError && tokenDetails ) ? <Collectible
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
            name={asset.name}
            image={handleUri(asset.image)}
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