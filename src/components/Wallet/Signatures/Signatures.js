import styles from './Signatures.module.scss'
import { useLocalStorage } from 'hooks'

import { Image, Pagination } from 'components/common'
import React, { useState, useEffect, useMemo } from 'react'
import { isHexString, toUtf8String } from 'ethers/lib/utils'
import { id } from 'ethers/lib/utils'

import { AiFillAppstore } from 'react-icons/ai'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useParams } from 'react-router-dom'
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

function Signatures({ selectedAcc, selectedNetwork, privateMode }) {

  const [messages, setMessages] = useLocalStorage({
    storage: useLocalStorage,
    key: 'signedMessages',
    defaultValue: []
  })

  const filteredMessages = useMemo(() =>
    messages
      .filter(m =>
        m.account === selectedAcc
        && m.networkId === selectedNetwork.chainId
      )
      .sort((a, b) => b.date - a.date)
  , [messages, selectedNetwork, selectedAcc])

  const [expansions, setExpansions] = useState({})

  const params = useParams()
  const parentPage = params.page

  //hacky, and preventing Outer scope values warning. but either this, either having a localstorage listener
  let localSignedMessagesStr = localStorage.signedMessages

  useEffect(() => {
    try {
      setMessages(JSON.parse(localSignedMessagesStr))
    } catch (err) {
      console.error('SignedMessages localstorage: invalid format')
    }
  }, [setMessages, localSignedMessagesStr])

  const [paginatedMessages, setPaginatedMessages] = useState([])

  return (
    <div className={cn(styles.signatures)}>
      <div className={cn(styles.title)}>
        <h2>Signed Messages History</h2>
        <Pagination
          items={filteredMessages}
          setPaginatedItems={setPaginatedMessages}
          itemsPerPage={ITEMS_PER_PAGE}
          url='/wallet/messages/{p}'
          parentPage={parentPage}
        />
      </div>
      {
        !filteredMessages.length
          ? (
            <div className={cn(styles.mainContainer)}>
              No messages signed with the account { privateMode.hidePrivateValue(selectedAcc) } yet on {selectedNetwork.id}
            </div>
          )
          : (
            <div>
              <div className={cn(styles.mainContainer)}>
                <div className={cn(styles.headerContainer)}>
                  <div className={cn(styles.dapp, styles.colDapp)}>
                    <div className={cn(styles.dappTitle)}>Dapp</div>
                  </div>
                  <div className={cn(styles.colSigtype)}>Type</div>
                  <div className={cn(styles.colDate)}>Signed on</div>
                  <div className={cn(styles.colExpand, styles.signatureExpand)}></div>
                </div>
                {
                  paginatedMessages && paginatedMessages.map((m, index) => {
                    const hash = id(JSON.stringify(m))
                    return (
                      <div className={cn(styles.subContainer)} key={index} >
                        <div className={cn(styles.subContainerVisible)} >
                          <div className={cn(styles.dapp, styles.colDapp)} >
                            <div className={cn(styles.dappIcon)} >
                              {
                                m.dApp?.icons[0]
                                  ? (
                                    <Image src={m.dApp.icons[0]} size={32} />
                                  )
                                  : (
                                    <AiFillAppstore style={{ opacity: 0.5 }}/>
                                  )
                              }
                            </div>
                            <div className={cn(styles.dappTitle)} >{m.dApp?.name || 'Unknown dapp'}</div>
                          </div>
                          <div className={cn(styles.colSigtype)} >{m.typed ? '1271 TypedData' : 'Standard'}</div>
                          <div
                            className={cn(styles.colDate)} >{`${new Date(m.date).toLocaleDateString()} ${new Date(m.date).toLocaleTimeString()}`}</div>
                          <div className={cn(styles.colExpand, styles.signatureExpand)} onClick={() => {
                            setExpansions(prev => ({ ...prev, [hash]: !prev[hash] }))
                          }}>{expansions[hash] ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        </div>
                        {
                          expansions[hash] &&
                          <div className={cn(styles.subContainerExpanded)}>
                            <div>
                              <b>Signer</b>
                              <div className={cn(styles.messageContent)} >
                                {m.signer.address || m.signer.quickAcc}
                              </div>
                            </div>
                            <div>
                              <b>Message</b>
                              <div className={cn(styles.messageContent)} >
                                {
                                  m.typed
                                    ? <div>{JSON.stringify(m.message, null, ' ')}</div>
                                    : <div>{getMessageAsText(m.message)}</div>
                                }
                              </div>
                            </div>
                            <div>
                              <b>Signature</b>
                              <div className={cn(styles.messageContent)} >
                                {m.signature}
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    )
                  })
                }
              </div>
              <Pagination
                items={filteredMessages}
                setPaginatedItems={setPaginatedMessages}
                itemsPerPage={ITEMS_PER_PAGE}
                url='/wallet/messages/{p}'
                parentPage={parentPage}
              />
            </div>
          )
      }
    </div>
  )


}

export default Signatures
