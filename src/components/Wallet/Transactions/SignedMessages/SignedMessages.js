import styles from './SignedMessages.module.scss'

import React, { useState } from 'react'
import { Image } from 'components/common'
import { id } from 'ethers/lib/utils'
import { isHexString, toUtf8String } from 'ethers/lib/utils'
import { AiFillAppstore } from 'react-icons/ai'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import cn from 'classnames'

const ITEMS_PER_PAGE = 8

function getMessageAsText(msg) {
    if (isHexString(msg)) {
      try {
        return toUtf8String(msg)
      } catch (_) {
        return msg
      }
    }
    return msg?.toString ? msg.toString() : msg + "" //what if dapp sends it as object? force string to avoid app crashing
  }

const SignedMessages = React.memo(
  ({ filteredMessages, privateMode, page, selectedAcc, selectedNetwork }) => {
    const paginatedMessages = filteredMessages.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
    const [expansions, setExpansions] = useState({});

    return !filteredMessages.length ? (
      <div className={styles.signedMessages}>
        No messages signed with the account{" "}
        {privateMode.hidePrivateValue(selectedAcc)} yet on {selectedNetwork.id}
      </div>
    ) : (
      <div>
        <div className={styles.signedMessages}>
          <div className={styles.headerContainer}>
            <div className={cn(styles.dapp, styles.colDapp)}>
              <div className={styles.dappTitle}>Dapp</div>
            </div>
            <div className={styles.colSigtype}>Type</div>
            <div className={styles.colDate}>Signed on</div>
            <div className={cn(styles.colExpand, styles.signatureExpand)}></div>
          </div>
          {paginatedMessages &&
            paginatedMessages.map((m, index) => {
              const hash = id(JSON.stringify(m));
              return (
                <div className={styles.subContainer} key={index}>
                  <div className={styles.subContainerVisible}>
                    <div className={cn(styles.dapp, styles.colDapp)}>
                      <div className={styles.dappIcon}>
                        {m.dApp?.icons[0] ? (
                          <Image src={m.dApp.icons[0]} size={32} />
                        ) : (
                          <AiFillAppstore style={{ opacity: 0.5 }} />
                        )}
                      </div>
                      <div className={styles.dappTitle}>
                        {m.dApp?.name || "Unknown dapp"}
                      </div>
                      <div
                        className={cn(styles.colExpandMobile, styles.signatureExpand)}
                        onClick={() => {
                            setExpansions((prev) => ({
                            ...prev,
                            [hash]: !prev[hash],
                            }));
                        }}
                      >
                        {expansions[hash] ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                    </div>
                    <div className={styles.colSigtype}>
                        <div className={styles.colSigtypeLabel}>Type</div>
                        <div className={styles.colSigtypeValue}>{m.typed ? "1271 TypedData" : "Standard"}</div>
                    </div>
                    <div className={styles.colDate}>
                        <div className={styles.colDateLabel}>Signed On</div>
                        <div className={styles.colDateValue}>
                            {
                                `${new Date(
                                m.date
                                ).toLocaleDateString()} ${new Date(
                                m.date
                                ).toLocaleTimeString()}`
                            }
                        </div>
                    </div>
                    <div
                      className={cn(styles.colExpand, styles.signatureExpand)}
                      onClick={() => {
                        setExpansions((prev) => ({
                          ...prev,
                          [hash]: !prev[hash],
                        }));
                      }}
                    >
                      {expansions[hash] ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </div>
                  {expansions[hash] && (
                    <div className={styles.subContainerExpanded}>
                      <div>
                        <b>Signer</b>
                        <div className={styles.messageContent}>
                          {m.signer.address || m.signer.quickAcc}
                        </div>
                      </div>
                      <div>
                        <b>Message</b>
                        <div className={styles.messageContent}>
                          {m.typed ? (
                            <div>{JSON.stringify(m.message, null, " ")}</div>
                          ) : (
                            <div>{getMessageAsText(m.message)}</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <b>Signature</b>
                        <div className={styles.messageContent}>
                          {m.signature}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
);

export default SignedMessages;
