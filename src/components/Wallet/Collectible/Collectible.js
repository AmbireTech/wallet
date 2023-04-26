import './Collectible.scss'

import { useParams } from 'react-router-dom'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useCallback, useEffect, useState, useRef } from 'react'
import { AiOutlineSend } from 'react-icons/ai'
import { BsFillImageFill, BsXLg } from 'react-icons/bs'
import * as blockies from 'blockies-ts'
import { useToasts } from 'hooks/toasts'
import {
  TextInput,
  Button,
  Loading,
  AddressBook,
  AddressWarning,
  ToolTip,
  Panel
} from 'components/common'
import ERC721Abi from 'ambire-common/src/constants/abis/ERC721Abi'
import networks from 'consts/networks'
import { validateSendNftAddress } from 'lib/validations/formValidations'
import { getProvider } from 'ambire-common/src/services/provider'
import { VELCRO_API_ENDPOINT } from 'config'
import { fetchGet } from 'lib/fetch'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { resolveENSDomain, getBip44Items } from 'lib/ensDomains'

const ERC721 = new Interface(ERC721Abi)

const handleUri = (uri) => {
  if (!uri) return ''
  uri = uri.startsWith('data:application/json')
    ? uri.replace('data:application/json;utf8,', '')
    : uri

  if (uri.split('/').length === 1) return `https://ipfs.io/ipfs/${uri}`
  if (uri.split('/')[0] === 'data:image') return uri
  if (uri.startsWith('ipfs://'))
    return uri.replace(/ipfs:\/\/ipfs\/|ipfs:\/\//g, 'https://ipfs.io/ipfs/')
  if (uri.split('/')[2].endsWith('mypinata.cloud'))
    return `https://ipfs.io/ipfs/${uri.split('/').slice(4).join('/')}`

  return uri
}

const Collectible = ({ selectedAcc, selectedNetwork, addRequest, addressBook }) => {
  const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook

  const { addToast } = useToasts()
  const { network, collectionAddr, tokenId } = useParams()
  const [isLoading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState({
    owner: {
      address: '',
      icon: ''
    },
    name: '',
    description: '',
    image: '',
    collection: '',
    explorerUrl: ''
  })
  const [recipientAddress, setRecipientAddress] = useState('')
  const [uDAddress, setUDAddress] = useState('')
  const [ensAddress, setEnsAddress] = useState('')
  const [isTransferDisabled, setTransferDisabled] = useState(true)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [newAddress, setNewAddress] = useState(null)
  const [validationFormMgs, setValidationFormMgs] = useState({
    success: false,
    message: ''
  })
  const timer = useRef(null)

  const sendTransferTx = () => {
    const recipAddress = uDAddress || ensAddress || recipientAddress

    try {
      const req = {
        id: `transfer_nft_${Date.now()}`,
        dateAdded: new Date().valueOf(),
        type: 'eth_sendTransaction',
        chainId: selectedNetwork.chainId,
        account: selectedAcc,
        txn: {
          to: collectionAddr,
          value: '0',
          data: ERC721.encodeFunctionData('transferFrom', [
            metadata.owner.address,
            recipAddress,
            tokenId
          ])
        },
        meta: null
      }

      if (uDAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: recipientAddress,
            address: uDAddress
          }
        }
      } else if (ensAddress) {
        req.meta = {
          addressLabel: {
            addressLabel: recipientAddress,
            address: ensAddress
          }
        }
      }

      addRequest(req)
    } catch (e) {
      console.error(e)
      addToast(`Error: ${e.message || e}`, { error: true })
    }
  }

  useEffect(() => {
    if (recipientAddress.startsWith('0x') && recipientAddress.indexOf('.') === -1) {
      const isAddressValid = validateSendNftAddress(
        recipientAddress,
        selectedAcc,
        addressConfirmed,
        isKnownAddress,
        metadata,
        selectedNetwork,
        network
      )

      setTransferDisabled(!isAddressValid.success)
      setValidationFormMgs({
        success: isAddressValid.success,
        message: isAddressValid.message ? isAddressValid.message : ''
      })
    } else {
      if (timer.current) {
        clearTimeout(timer.current)
      }

      const validateForm = async () => {
        const UDAddress = await resolveUDomain(
          recipientAddress,
          null,
          selectedNetwork.unstoppableDomainsChain
        )
        const bip44Item = getBip44Items(null)
        const ensAddress = await resolveENSDomain(recipientAddress, bip44Item)

        timer.current = null
        const isUDAddress = !!UDAddress
        const isEnsAddress = !!ensAddress
        let selectedAddress = ''
        if (isEnsAddress) selectedAddress = ensAddress
        else if (isUDAddress) selectedAddress = UDAddress
        else selectedAddress = recipientAddress

        const isAddressValid = validateSendNftAddress(
          selectedAddress,
          selectedAcc,
          addressConfirmed,
          isKnownAddress,
          metadata,
          selectedNetwork,
          network,
          isUDAddress,
          isEnsAddress
        )
        setUDAddress(UDAddress)
        setEnsAddress(ensAddress)

        setTransferDisabled(!isAddressValid.success)
        setValidationFormMgs({
          success: isAddressValid.success,
          message: isAddressValid.message ? isAddressValid.message : ''
        })
      }

      timer.current = setTimeout(async () => {
        try {
          validateForm()
        } catch (e) {
          console.log(e)
        }
      }, 300)
    }

    return () => clearTimeout(timer.current)
  }, [
    recipientAddress,
    metadata,
    selectedNetwork,
    selectedAcc,
    network,
    addressConfirmed,
    isKnownAddress
  ])

  const fetchMetadata = useCallback(async () => {
    setLoading(true)
    setMetadata({})

    try {
      const networkDetails = networks.find(({ id }) => id === network)
      if (!networkDetails) throw new Error('This network is not supported')

      const { explorerUrl } = networkDetails
      const provider = getProvider(networkDetails.id)
      const contract = new ethers.Contract(collectionAddr, ERC721Abi, provider)

      const [collection, address, maybeUri1, maybeUri2] = await Promise.all([
        contract.name(),
        contract.ownerOf(tokenId),
        contract
          .tokenURI(tokenId)
          .then((uri) => ({ uri }))
          .catch((err) => ({ err })),
        contract
          .uri(tokenId)
          .then((uri) => ({ uri }))
          .catch((err) => ({ err }))
      ])
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

      const image = json ? handleUri(json.image) : null
      setMetadata((metadata) => ({
        ...metadata,
        ...json,
        image
      }))

      setMetadata((metadata) => ({
        ...metadata,
        collection,
        owner: {
          address,
          icon: blockies.create({ seed: address }).toDataURL()
        },
        explorerUrl
      }))

      setLoading(false)
    } catch (e) {
      try {
        const { success, collection, description, image, name, owner, message } = await fetchGet(
          `${VELCRO_API_ENDPOINT}/nftmeta/${collectionAddr}/${tokenId}?network=${network}`
        )
        if (!success) throw new Error(message)

        const networkDetails = networks.find(({ id }) => id === network)
        if (!networkDetails) throw new Error('This network is not supported')

        const { explorerUrl } = networkDetails
        setMetadata((metadata) => ({
          ...metadata,
          collection,
          description,
          image,
          name,
          owner: {
            address: owner,
            icon: blockies.create({ seed: owner }).toDataURL()
          },
          explorerUrl
        }))

        setLoading(false)
      } catch (e) {
        console.error(e)
        addToast(`Collectible error: ${e.message || e}`, { error: true })
      }
    }
  }, [addToast, tokenId, collectionAddr, network])

  useEffect(() => fetchMetadata(), [fetchMetadata])

  return (
    <div id="collectible">
      <Panel className="panel">
        <div className="heading">
          <div className="title">
            {metadata.collection} #{tokenId}
          </div>
          <div className="contract">
            Contract address:{' '}
            <a
              className="address"
              href={`${metadata.explorerUrl}/address/${collectionAddr}`}
              target="_blank"
              rel="noreferrer"
            >
              {collectionAddr}
            </a>
          </div>
        </div>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="metadata">
            <div className="image" style={{ backgroundImage: `url(${handleUri(metadata.image)})` }}>
              {!metadata.image ? <BsFillImageFill /> : null}
            </div>
            <div className="info">
              <div className="name">{metadata.name}</div>
              <div className="description">{metadata.description}</div>
            </div>
            <div className="owner">
              Owner:
              <a
                className="address"
                href={`${metadata.explorerUrl}/address/${metadata.owner.address}`}
                target="_blank"
                rel="noreferrer"
              >
                <div className="icon" style={{ backgroundImage: `url(${metadata.owner.icon})` }} />
                {metadata.owner.address === selectedAcc ? (
                  <span>You ({metadata.owner.address})</span>
                ) : (
                  metadata.owner.address
                )}
              </a>
            </div>
          </div>
        )}
      </Panel>
      <Panel title="Transfer" className="panel">
        <div className="content">
          <div id="recipient-address">
            <TextInput
              className="recipient-input"
              placeholder="Recipient Address"
              value={recipientAddress}
              onInput={(value) => setRecipientAddress(value)}
            />
            <ToolTip
              label={
                !ensAddress
                  ? 'You can use Ethereum Name ServiceⓇ'
                  : 'Valid Ethereum Name ServicesⓇ domain'
              }
            >
              <div id="ens-logo" className={ensAddress ? 'ens-logo-active ' : ''} />
            </ToolTip>
            <ToolTip
              label={
                !uDAddress
                  ? 'You can use Unstoppable domainsⓇ'
                  : 'Valid Unstoppable domainsⓇ domain'
              }
            >
              <div id="udomains-logo" className={uDAddress ? 'ud-logo-active ' : ''} />
            </ToolTip>
            <AddressBook
              addresses={addresses.filter((x) => x.address !== selectedAcc)}
              addAddress={addAddress}
              removeAddress={removeAddress}
              newAddress={newAddress}
              onClose={() => setNewAddress(null)}
              onSelectAddress={(address) => setRecipientAddress(address)}
              selectedNetwork={selectedNetwork}
              className="address-book"
            />
          </div>
          {validationFormMgs.message && (
            <div className="validation-error">
              <BsXLg size={12} />
              &nbsp;{validationFormMgs.message}
            </div>
          )}
          <div className="separator" />
          <AddressWarning
            address={uDAddress || ensAddress || recipientAddress}
            onAddNewAddress={() => setNewAddress(uDAddress || ensAddress || recipientAddress)}
            onChange={(value) => setAddressConfirmed(value)}
            isKnownAddress={isKnownAddress}
          />
          <Button
            variant="primaryGradient"
            startIcon={<AiOutlineSend />}
            disabled={isTransferDisabled}
            onClick={sendTransferTx}
          >
            Send
          </Button>
        </div>
      </Panel>
    </div>
  )
}

export default Collectible
