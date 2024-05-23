import './Collectible.scss'

import { rpcUrls } from 'config/providers'
import { useParams } from 'react-router-dom'
import { Interface } from 'ethers/lib/utils'
import { useEffect, useState, useRef, useMemo } from 'react'
import { AiOutlineSend } from 'react-icons/ai'
import {  BsXLg } from 'react-icons/bs'
import FallbackImage from 'resources/icons/fallback.svg'
import * as blockies from 'blockies-ts'
import { useToasts } from 'hooks/toasts'
import {
  TextInput,
  Button,
  Loading,
  AddressBook,
  AddressWarning,
  ToolTip,
  Panel,
  Image
} from 'components/common'
import ERC721Abi from 'ambire-common/src/constants/abis/ERC721Abi'
import { validateSendNftAddress } from 'lib/validations/formValidations'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { resolveENSDomain, getBip44Items } from 'lib/ensDomains'
import useConstants from 'hooks/useConstants'
import { NFT_CDN_URL } from 'config'

const ERC721 = new Interface(ERC721Abi)

const Collectible = ({ portfolio, selectedAcc, selectedNetwork, addRequest, addressBook }) => {
  const {
    constants: { humanizerInfo }
  } = useConstants()
  const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook

  const { addToast } = useToasts()
  const { network, collectionAddr, tokenId } = useParams()
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
  const collection =
    portfolio.collectibles.find(
      (cn) =>
        cn.address.toLowerCase() === collectionAddr.toLowerCase() &&
        cn.assets.find((cb) => cb.tokenId === tokenId)
    ) || null

  const metadata = useMemo(() => {
    const collectible = collection?.assets.find((cb) => cb.tokenId === tokenId) || null

    if (!collectible) return null

    const {
      name,
      description,
    } = collectible

    return {
      name,
      description,
      image : `${NFT_CDN_URL}/proxy?rpc=${rpcUrls[collection.network]}&contract=${collection.address}&id=${collectible.tokenId}`,
      owner: {
        address: selectedAcc,
        icon: blockies.create({ seed: selectedAcc }).toDataURL()
      }
    }
  }, [collection, selectedAcc, tokenId])

  const sendTransferTx = () => {
    if (!metadata) return addToast('Collectible not found', { error: true })
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
    if (!metadata) return
    if (recipientAddress.startsWith('0x') && recipientAddress.indexOf('.') === -1) {
      const isAddressValid = validateSendNftAddress(
        recipientAddress,
        selectedAcc,
        addressConfirmed,
        isKnownAddress,
        metadata,
        selectedNetwork,
        network,
        humanizerInfo
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
          humanizerInfo,
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
    isKnownAddress,
    humanizerInfo
  ])

  if (!metadata && !portfolio.collectibles.length) return <Loading />

  if (!metadata && portfolio.collectibles.length)
    return (
      <Panel>
        <p className="error">Collectible not found</p>
      </Panel>
    )

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

        <div className="metadata">
          <div className="image" >
            <Image
              alt=""
              style={{width:"100%"}}
              src={`${NFT_CDN_URL}/proxy?rpc=${rpcUrls[collection.network]}&contract=${collectionAddr}&id=${tokenId}`}
              fallbackImage={FallbackImage}
              size={"100%"}
            />
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
