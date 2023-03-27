import { useState } from 'react'

import { AddressList, TextInput } from 'components/common'

import styles from './Addresses.module.scss'

const handleSearch = ({ addresses, query }) => {
  if (!addresses) return []
  if (!query) return addresses

  return addresses.filter(({ name, address }) => {
    const nameMatch = name.toLowerCase().includes(query.toLowerCase())
    const addressMatch = address.toLowerCase().includes(query.toLowerCase())

    return nameMatch || addressMatch
  })
}

export default function Addresses({ addresses, selectAddress, removeAddress, addressClassName }) {
  const [query, setQuery] = useState('')

  return (
    <div className={styles.wrapper}>
      <TextInput
        inputContainerClass={styles.input}
        small
        onInput={(value) => setQuery(value)}
        value={query}
        placeholder="Search..."
      />
      <AddressList
        addresses={handleSearch({ addresses, query })}
        onSelectAddress={selectAddress}
        removeAddress={removeAddress}
        addressClassName={addressClassName}
      />
    </div>
  )
}
