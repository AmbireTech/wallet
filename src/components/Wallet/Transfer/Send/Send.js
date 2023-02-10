import { BsXLg } from 'react-icons/bs'
import { MdWarning } from 'react-icons/md'
import { useEffect, useMemo, useState, useRef } from 'react'
import { ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { useToasts } from 'hooks/toasts'
import { TextInput, NumberInput, Button, Select, Loading, AddressBook, AddressWarning, NoFundsPlaceholder, Checkbox, ToolTip } from 'components/common'
import { validateSendTransferAddress, validateSendTransferAmount } from 'lib/validations/formValidations'
import { resolveUDomain } from 'lib/unstoppableDomains'
import { MdInfo } from 'react-icons/md'
import networks from 'consts/networks'
import { getTokenIcon } from 'lib/icons'
import { formatFloatTokenAmount } from 'lib/formatters'
import { resolveENSDomain, getBip44Items } from 'lib/ensDomains'
import useGasTankData from 'ambire-common/src/hooks/useGasTankData'
import { useRelayerData } from 'hooks'
import cn from 'classnames'

import styles from './Send.module.scss'

const ERC20 = new Interface(require('adex-protocol-eth/abi/ERC20'))
const unsupportedSWPlatforms = ['Binance', 'Huobi', 'KuCoin', 'Gate.io', 'FTX']

const Send = ({ 
  history, 
  portfolio, 
  selectedAcc, 
  selectedNetwork, 
  addRequest, 
  addressBook, 
  relayerURL, 
  address, 
  setAddress, 
  gasTankDetails, 
  asset, 
  setAsset, 
  tokenAddress, 
  selectedAsset,
  title
}) => {
  const { addresses, addAddress, removeAddress, isKnownAddress } = addressBook
  const {
      feeAssetsRes
    } = useGasTankData({
      relayerURL,
      selectedAcc,
      network: selectedNetwork,
      portfolio,
      useRelayerData
    })
  const feeAssetsPerNetwork = feeAssetsRes && feeAssetsRes.length && feeAssetsRes.filter(item => (item.network === selectedNetwork.id) && !item.disableGasTankDeposit)
  const { addToast } = useToasts()

  const [amount, setAmount] = useState(0)
  const [bigNumberHexAmount, setBigNumberHexAmount] = useState('')
  const [uDAddress, setUDAddress] = useState('')
  const [ensAddress, setEnsAddress] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [addressConfirmed, setAddressConfirmed] = useState(false)
  const [sWAddressConfirmed, setSWAddressConfirmed] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [validationFormMgs, setValidationFormMgs] = useState({
      success: {
          amount: false,
          address: false
      },
      messages: {
          amount: '',
          address: ''
      }
  })
  const [feeBaseTokenWarning, setFeeBaseTokenWarning] = useState('')
  const timer = useRef(null)
  let eligibleFeeTokens = null
  if (gasTankDetails?.isTopUp) {
      eligibleFeeTokens = portfolio.tokens.filter(item => feeAssetsPerNetwork && feeAssetsPerNetwork?.some(i => i.address.toLowerCase() === item.address.toLowerCase()))
  } else eligibleFeeTokens = portfolio.tokens
  
  const assetsItems = eligibleFeeTokens.map(({ label, symbol, address, img, tokenImageUrl, network }) => ({
      label: label || symbol,
      value: address,
      icon: img || tokenImageUrl,
      fallbackIcon: getTokenIcon(network, address)
  }))

  const { maxAmount, maxAmountFormatted } = useMemo(() => {
      if (!selectedAsset) return { maxAmount: '0', maxAmountFormatted: '0.00' };
      const { balanceRaw, decimals, balance } = selectedAsset
      return {
          maxAmount: ethers.utils.formatUnits(balanceRaw, decimals),
          maxAmountFormatted: formatFloatTokenAmount(balance, true, decimals)
      }
  }, [selectedAsset])

  const showSWAddressWarning = useMemo(() =>
      !gasTankDetails && Number(tokenAddress) === 0 && networks.map(({ id }) => id).filter(id => id !== 'ethereum').includes(selectedNetwork.id)
      , [gasTankDetails, tokenAddress, selectedNetwork.id])

  const setMaxAmount = () => onAmountChange(maxAmount)

  const onAmountChange = value => {
      if (value) {
          const { decimals } = selectedAsset
          const bigNumberAmount = ethers.utils.parseUnits(value, decimals).toHexString()
          setBigNumberHexAmount(bigNumberAmount)
      }

      setAmount(value)
  }

  const sendTx = () => {
      const recipientAddress = uDAddress ? uDAddress : ensAddress ? ensAddress :  address
      if (!bigNumberHexAmount) return 
      
      try {
          const txn = {
              to: selectedAsset.address,
              value: '0',
              data: ERC20.encodeFunctionData('transfer', [recipientAddress, bigNumberHexAmount])
          }

          if (Number(selectedAsset.address) === 0) {
              txn.to = recipientAddress
              txn.value = bigNumberHexAmount
              txn.data = '0x'
          }

          let req = {
              id: `transfer_${Date.now()}`,
              dateAdded: new Date().valueOf(),
              type: 'eth_sendTransaction',
              chainId: selectedNetwork.chainId,
              account: selectedAcc,
              txn,
              meta: null
          }

          if (uDAddress) {
              req.meta = {
                  addressLabel: {
                      addressLabel: address,
                      address: uDAddress
                  }
              }
          } else if (ensAddress) {
              req.meta = {
                  addressLabel: {
                      addressLabel: address,
                      address: ensAddress
                  }
              }
          }

          addRequest(req)
          setAddress('')
          setAmount(0)
      } catch (e) {
          console.error(e)
          addToast(`Error: ${e.message || e}`, { error: true })
      }
  }

  useEffect(() => {
      // check gasTank topUp with token for convertion
      setFeeBaseTokenWarning('')
      if (gasTankDetails?.isTopUp){
          const gasFeeToken = feeAssetsPerNetwork && feeAssetsPerNetwork.find(ft => ft?.address?.toLowerCase() === selectedAsset?.address?.toLowerCase())
          if (gasFeeToken?.baseToken) {
              const feeBaseToken = feeAssetsPerNetwork && feeAssetsPerNetwork.find(ft => ft.address.toLowerCase() === gasFeeToken.baseToken.toLowerCase())
              setFeeBaseTokenWarning(`Token ${gasFeeToken.symbol.toUpperCase()} will be converted to ${feeBaseToken.symbol.toUpperCase()} without additional fees.`)
          }
      }
  }, [feeAssetsPerNetwork, gasTankDetails?.isTopUp, selectedAsset])

  useEffect(() => {
      setAmount(0)
      setBigNumberHexAmount('')
      setSWAddressConfirmed(false)
  }, [asset, selectedNetwork.id])

  useEffect(() => {
      if (!selectedAsset) return
      history.replace({ pathname: `/wallet/transfer/${Number(asset) !== 0 ? asset : selectedAsset.symbol}` })
  }, [asset, history, selectedAsset])

  useEffect(() => {
      const isValidSendTransferAmount = validateSendTransferAmount(amount, selectedAsset)

      if (address.startsWith('0x') && (address.indexOf('.') === -1)) {
          if (uDAddress !== '') setUDAddress('')
          if (ensAddress !== '') setEnsAddress('')
          const isValidRecipientAddress = validateSendTransferAddress(address, selectedAcc, addressConfirmed, isKnownAddress)

          setValidationFormMgs({
              success: {
                  amount: isValidSendTransferAmount.success,
                  address: isValidRecipientAddress.success
              },
              messages: {
                  amount: isValidSendTransferAmount.message ? isValidSendTransferAmount.message : '',
                  address: isValidRecipientAddress.message ? isValidRecipientAddress.message : ''
              }
          })

          setDisabled(!isValidRecipientAddress.success || !isValidSendTransferAmount.success || (showSWAddressWarning && !sWAddressConfirmed))
      } else {
          if (timer.current) {
              clearTimeout(timer.current)
          }

          const validateForm = async () => {
              const UDAddress = await resolveUDomain(address, selectedAsset ? selectedAsset.symbol : null, selectedNetwork.unstoppableDomainsChain)
              const bip44Item = getBip44Items(selectedAsset ? selectedAsset.symbol : null)
              const ensAddr = await resolveENSDomain(address, bip44Item)
              timer.current = null
              const isUDAddress = UDAddress ? true : false
              const isEnsAddress = ensAddr ? true : false
              let selectedAddress = ''
              if (isEnsAddress) selectedAddress = ensAddr
              else if (isUDAddress) selectedAddress = UDAddress
              else selectedAddress = address

              const isValidRecipientAddress = validateSendTransferAddress(selectedAddress, selectedAcc, addressConfirmed, isKnownAddress, isUDAddress, isEnsAddress)

              setUDAddress(UDAddress)
              setEnsAddress(ensAddr)
              setValidationFormMgs({
                  success: {
                      amount: isValidSendTransferAmount.success,
                      address: isValidRecipientAddress.success
                  },
                  messages: {
                      amount: isValidSendTransferAmount.message ? isValidSendTransferAmount.message : '',
                      address: isValidRecipientAddress.message ? isValidRecipientAddress.message : ''
                  }
              })

              setDisabled(!isValidRecipientAddress.success || !isValidSendTransferAmount.success || (showSWAddressWarning && !sWAddressConfirmed))
          }

          timer.current = setTimeout(async () => {
              return validateForm().catch(console.error)
          }, 300)
      }
      return () => clearTimeout(timer.current)
  }, [address, amount, selectedAcc, selectedAsset, addressConfirmed, showSWAddressWarning, sWAddressConfirmed, isKnownAddress, addToast, selectedNetwork, addAddress, uDAddress, disabled, ensAddress])

    const amountLabel = <div className={styles.amountLabel}>Available Amount: <span>{maxAmountFormatted} {selectedAsset?.symbol}</span></div>

    const sortedAssetsItems = [
        ...assetsItems.filter(i => i.label.toLowerCase() === 'wallet'),
        ...assetsItems.filter(i => i.label.toLowerCase() !== 'wallet').sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1),
    ]

    if (portfolio.isCurrNetworkBalanceLoading) {
        return <Loading />
    }


    return sortedAssetsItems.length ? (<div className={styles.wrapper}>
            {title}
            <div className={styles.content}>
                <Select searchable defaultValue={asset} items={sortedAssetsItems} onChange={({ value }) => setAsset(value)}/>
                { feeBaseTokenWarning ? <p className={styles.gasTankConvertMsg}><MdWarning /> {feeBaseTokenWarning}</p> : <></>}
                <NumberInput
                    label={amountLabel}
                    value={amount}
                    precision={selectedAsset?.decimals}
                    onInput={onAmountChange}
                    button="MAX"
                    onButtonClick={() => setMaxAmount()}
                />
                
                { validationFormMgs.messages.amount && 
                    (<div className={styles.validationError}><BsXLg size={12}/>&nbsp;{validationFormMgs.messages.amount}</div>)}
                { gasTankDetails ? <p className={styles.gasTankMsg}><MdWarning /> {gasTankDetails?.gasTankMsg}</p> : (<div className={styles.recipientField}>
                    <TextInput
                        placeholder="Recipient"
                        info="Please double-check the recipient address, blockchain transactions are not reversible."
                        value={address}
                        onInput={setAddress}
                        className={styles.recipientInput}
                        inputContainerClass={styles.textInputContainer}
                    />
                    <ToolTip label={!ensAddress ? 'You can use Ethereum Name ServiceⓇ' : 'Valid Ethereum Name ServicesⓇ domain'}>
                        <div className={cn(styles.ensLogo, {[styles.ensLogoActive]: ensAddress})} />
                    </ToolTip>
                    <ToolTip label={!uDAddress ? 'You can use Unstoppable domainsⓇ' : 'Valid Unstoppable domainsⓇ domain'}>
                        <div className={cn(styles.udomainsLogo, { [styles.udomainsLogoActive]: uDAddress })} />
                    </ToolTip>
                    <AddressBook
                        addresses={addresses.filter(x => x.address !== selectedAcc)}
                        addAddress={addAddress}
                        removeAddress={removeAddress}
                        newAddress={newAddress}
                        onClose={() => setNewAddress(null)}
                        onSelectAddress={address => setAddress(address)}
                        selectedNetwork={selectedNetwork}
                        className={styles.dropdown}
                    />
                </div>)}
                <div className={styles.confirmations}>
                    <AddressWarning
                        address={address}
                        onAddNewAddress={() => setNewAddress(address)}
                        onChange={(value) => setAddressConfirmed(value)}
                        isKnownAddress={isKnownAddress}
                        uDAddress={uDAddress}
                        ensAddress={ensAddress}
                        />
                    {showSWAddressWarning ? <Checkbox
                        className={styles.binanceAddressWarning}
                        label={<span>
                            I confirm this address is not a {unsupportedSWPlatforms.join(' / ')} address: <br />
                            These platforms do not support ${selectedAsset?.symbol} deposits from smart wallets
                            <a href='https://help.ambire.com/hc/en-us/articles/4415473743506-Statement-on-MATIC-BNB-deposits-to-Binance' target='_blank' rel='noreferrer'><MdInfo size={20} /></a>
                        </span>}
                        labelClassName={styles.checkBoxLabel}
                        checked={sWAddressConfirmed}
                        onChange={({ target }) => setSWAddressConfirmed(target.checked)}
                    /> : null}    
                </div>
                { validationFormMgs.messages.address && 
                    (<div className={styles.validationError}><BsXLg size={12}/>&nbsp;{validationFormMgs.messages.address}</div>)}
            </div>
            <Button primaryGradient disabled={disabled} onClick={sendTx} className={styles.transferButton}>Send</Button>
        </div>) : <NoFundsPlaceholder/>
}

export default Send