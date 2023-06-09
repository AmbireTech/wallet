import { isHexString, toUtf8String } from 'ethers/lib/utils'

import { Image } from 'components/common'

import { FaChevronDown, FaChevronUp } from 'react-icons/fa'

import styles from './SignedMessage.module.scss'

function getMessageAsText(msg) {
  if (isHexString(msg)) {
    try {
      return toUtf8String(msg)
    } catch (_) {
      return msg
    }
  }
  return msg?.toString ? msg.toString() : `${msg}` // what if dapp sends it as object? force string to avoid app crashing
}

export default function SignedMessage({ data, expansions, setExpansions, hash }) {
  const { dApp, message, signature, typed, date, signer } = data

  return (
    <div className={styles.wrapper} key={hash}>
      <div
        className={styles.body}
        onClick={() => {
          setExpansions((prev) => ({
            ...prev,
            [hash]: !prev[hash]
          }))
        }}
      >
        <div className={styles.dappInfo}>
          <Image
            src={dApp?.icons[0]}
            className={styles.dappIconWrapper}
            imageClassName={styles.dappIcon}
          />
          <p>{dApp?.name || 'Unknown dapp'}</p>
        </div>
        <div className={styles.typeAndTimestamp}>
          <p className={styles.type}>{typed ? '1271 TypedData' : 'Standard'}</p>
          <p className={styles.timestamp}>
            {`${new Date(date).toLocaleDateString()} ${new Date(date).toLocaleTimeString()}`}
          </p>
        </div>
        <div className={styles.expandIcon}>
          {expansions[hash] ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>
      {expansions[hash] && (
        <div className={styles.advanced}>
          {signer?.address || signer?.quickAcc ? (
            <div className={styles.advancedItem}>
              <h4 className={styles.advancedTitle}>Signer</h4>
              <p className={styles.advancedText}>{signer.address || signer.quickAcc}</p>
            </div>
          ) : null}
          <div className={styles.advancedItem}>
            <h4 className={styles.advancedTitle}>Message</h4>
            <p className={styles.advancedText}>
              {typed ? JSON.stringify(message, null, ' ') : getMessageAsText(message)}
            </p>
          </div>
          <div className={styles.advancedItem}>
            <h4 className={styles.advancedTitle}>Signature</h4>
            <p className={styles.advancedText}>{signature}</p>
          </div>
        </div>
      )}
    </div>
  )
}
