import React, { useCallback } from 'react'
import { DropDown } from 'components/common'
import useLocalStorage from 'hooks/useLocalStorage'
import DropDownItem from 'components/common/DropDown/DropDownItem/DropDownItem'
import { useModals } from 'hooks'
import ExtensionInviteCodeModal from 'components/Modals/ExtensionInviteCodeModal/ExtensionInviteCodeModal'
import styles from './Links.module.scss'

import { ReactComponent as QuestionMark } from './images/help.svg'
import { ReactComponent as ExtensionInviteCode } from './images/extension-invite-code.svg'
import { ReactComponent as QuestionMarkWithNotification } from './images/help-with-notification.svg'
import { ReactComponent as HelpCenter } from './images/help-center.svg'
import { ReactComponent as Issue } from './images/issue.svg'
import { ReactComponent as Discord } from './images/discord.svg'
import { ReactComponent as Twitter } from './images/twitter.svg'
import { ReactComponent as Telegram } from './images/telegram.svg'
import { ReactComponent as Tos } from './images/tos.svg'

const Links = ({ extensionInviteCodeUsed, inviteCode, accountId }) => {
  const { showModal } = useModals()
  const [, setExtensionInviteCodeModalSeenBy] = useLocalStorage({
    key: 'extensionInviteCodeModalSeenBy',
    defaultValue: []
  })
  const [linksViewed, setLinksViewed] = useLocalStorage({ key: 'linksViewed', defaultValue: false })

  const onOpen = useCallback(() => setLinksViewed(true), [setLinksViewed])

  const openExtensionInviteCodeModal = useCallback(() => {
    showModal(
      <ExtensionInviteCodeModal
        inviteCode={inviteCode}
        setExtensionInviteCodeModalSeenBy={setExtensionInviteCodeModalSeenBy}
        accountId={accountId}
        waitForClose={false}
      />
    )
  }, [accountId, inviteCode, setExtensionInviteCodeModalSeenBy, showModal])

  return (
    <DropDown
      className={`${styles.wrapper} ${linksViewed ? styles.viewed : ''}`}
      title={
        extensionInviteCodeUsed ? (
          <QuestionMark className={styles.titleIcon} />
        ) : (
          <QuestionMarkWithNotification className={styles.titleIcon} />
        )
      }
      onOpen={onOpen}
    >
      {!extensionInviteCodeUsed && (
        <DropDownItem className={styles.item}>
          <button type="button" onClick={openExtensionInviteCodeModal} target="_blank">
            <ExtensionInviteCode className={styles.itemIcon} /> Extension invitation code
          </button>
        </DropDownItem>
      )}
      <DropDownItem className={styles.item}>
        <a
          href="https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet"
          target="_blank"
          rel="noreferrer"
        >
          <HelpCenter className={styles.itemIcon} /> Help Center
        </a>
      </DropDownItem>
      <DropDownItem className={styles.item}>
        <a href="https://help.ambire.com/hc/en-us/requests/new" target="_blank" rel="noreferrer">
          <Issue className={styles.itemIcon} /> Report an issue
        </a>
      </DropDownItem>
      <DropDownItem className={styles.item}>
        <a href="https://www.ambire.com/discord" target="_blank" rel="noreferrer">
          <Discord className={styles.itemIcon} /> Discord
        </a>
      </DropDownItem>
      <DropDownItem className={styles.item}>
        <a href="https://twitter.com/AmbireWallet" target="_blank" rel="noreferrer">
          <Twitter className={styles.itemIcon} /> X
        </a>
      </DropDownItem>
      <DropDownItem className={styles.item}>
        <a href="https://t.me/AmbireOfficial" target="_blank" rel="noreferrer">
          <Telegram className={styles.itemIcon} /> Telegram
        </a>
      </DropDownItem>
      <DropDownItem className={styles.item}>
        <a
          href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf"
          target="_blank"
          rel="noreferrer"
        >
          <Tos className={styles.itemIcon} /> ToS
        </a>
      </DropDownItem>
    </DropDown>
  )
}

export default React.memo(Links)
