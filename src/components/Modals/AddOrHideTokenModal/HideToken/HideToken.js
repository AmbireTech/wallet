import { useMemo, useState } from 'react'
import {
  MdVisibilityOff as VisibleIcon,
  MdRemoveRedEye as HiddenIcon
} from 'react-icons/md'

import Token from 'components/Modals/AddOrHideTokenModal/Token/Token'

import styles from './HideToken.module.scss'
import { TextInput } from 'components/common'

const HideToken = ({
  network,
  account,
  portfolio,
  userSorting, 
  sortType
}) => {
  const { hiddenTokens, onAddHiddenToken, onRemoveHiddenToken, tokens } = portfolio
  const [search, setSearch] = useState('')

  const hideToken = (token) => onAddHiddenToken(token)
  const unhideToken = (token) => onRemoveHiddenToken(token.address)

  const sortedTokens = useMemo(() => {
    const tempTokens = tokens.concat(hiddenTokens).sort((a, b) => {
      if (sortType === 'custom' && userSorting.tokens?.items?.[`${account}-${network.chainId}`]?.length) {
        const sorted = userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(a.address) - userSorting.tokens.items[`${account}-${network.chainId}`].indexOf(b.address)
        return sorted
      } else {
        const decreasing = b.balanceUSD - a.balanceUSD
        if (decreasing === 0) return a.symbol.localeCompare(b.symbol)
        return decreasing
      }
    })

    return [...new Map(tempTokens.map(token => [token.address, token])).values()]
  }, [tokens, hiddenTokens, userSorting, sortType, account, network.chainId])

  const filteredTokens = sortedTokens.filter((token) => {
    const searchValue = search ? search.toLowerCase() : ''

    if (('address' in token) && ('symbol' in token)) {
      return token.address.toLowerCase().includes(searchValue) || token.symbol.toLowerCase().includes(searchValue)
    }

    return false
  })

  return (
    <div className={styles.wrapper}>
      <TextInput
        small
        label="Token Address or Symbol"
        placeholder="Input token address or symbol"
        onInput={value => setSearch(value)}
        className={styles.addressInput}
      />
      <div className={styles.tokens}>
        {filteredTokens.map((token) => {
          const {tokenImageUrl, network, symbol, address, isHidden} = token
          return (
            <Token
              key={address}
              address={address}
              icon={tokenImageUrl}
              name={symbol}
              network={network.toUpperCase()}
              className={styles.token}
            >
              {!isHidden ? 
                <HiddenIcon className={styles.icon} color="#27e8a7" onClick={() => hideToken(token)} /> :
                <VisibleIcon className={styles.icon} color="#F21A61" onClick={() => unhideToken(token)} />
              }
            </Token>
          )
        })}
      </div>
    </div>
  )
}

export default HideToken