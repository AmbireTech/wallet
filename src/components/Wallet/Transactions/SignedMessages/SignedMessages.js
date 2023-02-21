import React, { useState } from 'react'
import { id } from 'ethers/lib/utils'

import SignedMessage from './SignedMessage/SignedMessage'

import styles from './SignedMessages.module.scss'

const ITEMS_PER_PAGE = 8

const SignedMessages = ({ filteredMessages, privateMode, page, selectedAcc, selectedNetwork }) => {
	const paginatedMessages = filteredMessages.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
	const [expansions, setExpansions] = useState({})

	if (!filteredMessages.length) {
		return (
			<div className={styles.wrapper}>
				No messages signed with the account {privateMode.hidePrivateValue(selectedAcc)} yet on {selectedNetwork.id}
			</div>
		)
	}

	return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.dapp}>Dapp</h3>
        <h3>Type</h3>
        <h3>Signed on</h3>
        <div className={styles.placeholder}></div>
      </div>
      {paginatedMessages &&
        paginatedMessages.map((data) => (
          <SignedMessage
            data={data}
            expansions={expansions}
            setExpansions={setExpansions}
            hash={id(JSON.stringify(data))}
          />
        ))}
    </div>
	)
}

export default React.memo(SignedMessages)
