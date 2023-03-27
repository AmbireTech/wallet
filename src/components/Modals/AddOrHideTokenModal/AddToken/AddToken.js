import { MdOutlineRemove } from 'react-icons/md'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20'
import { useState } from 'react'
import { Contract } from 'ethers'
import { formatUnits, Interface } from 'ethers/lib/utils'
import { isValidAddress } from 'ambire-common/src/services/address'
import { getProvider } from 'ambire-common/src/services/provider'

import { getTokenIcon } from 'lib/icons'

import { useModals } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { Button, Loading, TextInput } from 'components/common'
import Token from 'components/Modals/AddOrHideTokenModal/Token/Token'

import styles from './AddToken.module.scss'

const ERC20Interface = new Interface(ERC20ABI)

const AddToken = ({ network, account, portfolio }) => {
  const { addToast } = useToasts()
  const { hideModal } = useModals()

  const { extraTokens, onAddExtraToken, onRemoveExtraToken } = portfolio

  const [loading, setLoading] = useState(false)
  const [tokenDetails, setTokenDetails] = useState(null)
  const [showError, setShowError] = useState(false)

  const disabled = !tokenDetails || !(tokenDetails.symbol && tokenDetails.decimals)

  const onInput = async (address) => {
    setTokenDetails(null)

    if (!isValidAddress(address)) return
    setLoading(true)
    setShowError(false)

    try {
      const provider = getProvider(network.id)
      const tokenContract = new Contract(address, ERC20Interface, provider)

      const [balanceOf, name, symbol, decimals] = await Promise.all([
        tokenContract.balanceOf(account),
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals()
      ])

      const balance = formatUnits(balanceOf, decimals)
      setTokenDetails({
        account,
        address: address.toLowerCase(),
        network: network.id,
        balance,
        balanceRaw: balanceOf.toString(),
        tokenImageUrl: getTokenIcon(network.id, address),
        name,
        symbol,
        decimals
      })
    } catch (e) {
      console.error(e)
      addToast('Failed to load token info', { error: true })
      setShowError(true)
    }

    setLoading(false)
  }

  const addToken = () => {
    onAddExtraToken(tokenDetails)
    hideModal()
  }

  const removeToken = (address) => {
    onRemoveExtraToken(address)
    hideModal()
  }

  const tokenStandard =
    network.id === 'binance-smart-chain'
      ? 'a BEP20'
      : network.id === 'ethereum'
      ? 'an ERC20'
      : 'a valid'

  return (
    <div className={styles.wrapper}>
      <TextInput
        small
        label="Token Address"
        placeholder="0x..."
        onInput={(value) => onInput(value)}
        className={styles.addressInput}
      />
      {showError ? (
        <div className={styles.validationError}>
          The address you entered does not appear to correspond to {tokenStandard} token on{' '}
          {network.name}.
        </div>
      ) : null}
      {loading ? (
        <Loading />
      ) : !showError && tokenDetails ? (
        <Token
          icon={tokenDetails.tokenImageUrl}
          name={tokenDetails.name}
          network={tokenDetails.network.toUpperCase()}
        >
          <div className={styles.balanceWrapper}>
            Balance: <span className={styles.balance}>{tokenDetails.balance}</span>{' '}
            <span className={styles.symbol}>{tokenDetails.symbol}</span>
          </div>
        </Token>
      ) : null}
      <Button primaryGradient className={styles.addButton} disabled={disabled} onClick={addToken}>
        Add Token
      </Button>
      <div className={styles.extraTokensList}>
        {extraTokens.map(({ address, name, symbol, tokenImageUrl, network }) => (
          <Token
            key={address}
            address={address}
            icon={tokenImageUrl}
            name={name}
            network={network.toUpperCase()}
            symbol={symbol}
            className={styles.token}
          >
            <div className={styles.actions}>
              <Button mini clear onClick={() => removeToken(address)}>
                <MdOutlineRemove />
              </Button>
            </div>
          </Token>
        ))}
      </div>
    </div>
  )
}

export default AddToken
