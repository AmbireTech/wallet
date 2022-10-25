import './Signatures.scss'
import { useLocalStorage } from 'hooks'

import { Button, Image } from 'components/common'
import React, { useCallback, useState, useEffect } from 'react'
import { isHexString, toUtf8String } from 'ethers/lib/utils'
import { id } from 'ethers/lib/utils'

import { AiFillAppstore } from 'react-icons/ai'
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi'
import { FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { useHistory, useParams } from 'react-router-dom'

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

  const params = useParams()
  const history = useHistory()

  const filteredMessages = messages
    .filter(m =>
      m.account === selectedAcc
      && m.networkId === selectedNetwork.chainId
    )
    .sort((a, b) => b.date - a.date)

  const maxPage = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE)

  // manage expanded state of signatures
  const [page, setPage] = useState(Math.min(params.page, maxPage) || 1)

  const [expansions, setExpansions] = useState({})

  //hacky, and preventing Outer scope values warning. but either this, either having a localstorage listener
  let localSignedMessagesStr = localStorage.signedMessages

  useEffect(() => {
    try {
      setMessages(JSON.parse(localSignedMessagesStr))
    } catch (err) {
      console.error('SignedMessages localstorage: invalid format')
    }
  }, [setMessages, localSignedMessagesStr])

  const paginatedMessages = filteredMessages.slice((page - 1) * ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE)

  const paginationControl = useCallback(() => {
    return (
      !!filteredMessages.length &&
      <div className={'pagination-controls-holder'}>
        <div className={'pagination-controls'}>
          Page
          {
            <Button clear mini disabled={page <= 1} onClick={() => setPage(page - 1)}><HiOutlineChevronLeft/></Button>
          }
          <span>{page} / {maxPage}</span>
          {
            <Button clear mini disabled={page >= maxPage}
                    onClick={() => setPage(page + 1)}><HiOutlineChevronRight/></Button>
          }
        </div>
      </div>
    )
  }, [page, maxPage, filteredMessages.length])

  useEffect(() => history.replace(`/wallet/messages/${page}`), [page, history])

  return (
    <div id={'Signatures'}>
      <div className={'title'}>
        <h2>Signed Messages History</h2>
        {paginationControl()}
      </div>
      {
        !filteredMessages.length
          ? (
            <div className={'main-container'}>
              No messages signed with the account { privateMode.hidePrivateValue(selectedAcc) } yet on {selectedNetwork.id}
            </div>
          )
          : (
            <div>

              <div className={'main-container'}>
                <div className={'header-container'}>
                  <div className={'dapp col-dapp'}>
                    <div className={'dapp-title'}>Dapp</div>
                  </div>
                  <div className={'signature-type col-sigtype'}>Type</div>
                  <div className={'signature-date col-date'}>Signed on</div>
                  <div className={'col-expand'}></div>
                </div>
                {
                  paginatedMessages && paginatedMessages.map((m, index) => {
                    const hash = id(JSON.stringify(m))
                    return (
                      <div className={'sub-container'} key={index}>
                        <div className={'sub-container-visible'}>
                          <div className={'dapp col-dapp'}>
                            <div className={'dapp-icon'}>
                              {
                                m.dApp?.icons[0]
                                  ? (
                                    <Image src={m.dApp.icons[0]}/>
                                  )
                                  : (
                                    <AiFillAppstore style={{ opacity: 0.5 }}/>
                                  )
                              }
                            </div>
                            <div className={'dapp-title'}>{m.dApp?.name || 'Unknown dapp'}</div>
                          </div>
                          <div className={'signature-type col-sigtype'}>{m.typed ? '1271 TypedData' : 'Standard'}</div>
                          <div
                            className={'signature-date col-date'}>{`${new Date(m.date).toLocaleDateString()} ${new Date(m.date).toLocaleTimeString()}`}</div>
                          <div className={'signature-expand col-expand'} onClick={() => {
                            setExpansions(prev => ({ ...prev, [hash]: !prev[hash] }))
                          }}>{expansions[hash] ? <FaChevronUp/> : <FaChevronDown/>}</div>
                        </div>
                        {
                          expansions[hash] &&
                          <div className={'sub-container-expanded'}>
                            <div>
                              <b>Signer</b>
                              <div className={'message-content'}>
                                {m.signer.address || m.signer.quickAcc}
                              </div>
                            </div>
                            <div>
                              <b>Message</b>
                              <div className={'message-content'}>
                                {
                                  m.typed
                                    ? <div>{JSON.stringify(m.message, null, ' ')}</div>
                                    : <div>{getMessageAsText(m.message)}</div>
                                }
                              </div>
                            </div>
                            <div>
                              <b>Signature</b>
                              <div className={'message-content'}>
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
              {paginationControl()}
            </div>
          )
      }
    </div>
  )


}

export default Signatures
