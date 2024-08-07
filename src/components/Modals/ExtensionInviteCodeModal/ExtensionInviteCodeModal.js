import { useCallback, useEffect, useState } from 'react'
import cn from 'classnames'

import { useModals } from 'hooks'

import { ReactComponent as AmbireLogo } from 'resources/logo-new.svg'
import { ReactComponent as CopyIcon } from 'resources/icons/copy-new.svg'
import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import { ReactComponent as ChromeWebStore } from 'resources/chrome-web-store.svg'

import { useToasts } from 'hooks/toasts'
import styles from './ExtensionInviteCodeModal.module.scss'

const CAN_CLOSE_AFTER_MS = 5000

const ExtensionInviteCodeModal = ({
  inviteCode,
  setExtensionInviteCodeModalSeenBy,
  accountId,
  waitForClose = true
}) => {
  const { onHideModal } = useModals()
  const { addToast } = useToasts()
  const [canClose, setCanClose] = useState(!waitForClose)

  const handleCloseModal = useCallback(() => {
    if (!canClose) return
    onHideModal()
    setExtensionInviteCodeModalSeenBy((prev) => {
      if (prev.includes(accountId)) return prev

      return [...prev, accountId]
    })
  }, [accountId, canClose, onHideModal, setExtensionInviteCodeModalSeenBy])

  useEffect(() => {
    const startingTime = Date.now()

    const timeout = setTimeout(() => {
      if (Date.now() - startingTime < CAN_CLOSE_AFTER_MS) return

      setCanClose(true)
    }, CAN_CLOSE_AFTER_MS)

    return () => {
      clearTimeout(timeout)
    }
  })

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteCode)
      addToast('Invite code copied to clipboard')
    } catch {
      addToast('Failed to copy invite code to clipboard', { error: true })
    }
  }, [addToast, inviteCode])

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerPrimaryGradient} />
        <div className={styles.headerSecondaryGradient} />
        <AmbireLogo className={styles.headerLogo} width={92} height={96} />
        <CloseIcon
          className={cn(styles.closeIcon, {
            [styles.closeIconEnabled]: canClose
          })}
          onClick={handleCloseModal}
        />
      </div>
      <div className={styles.content}>
        <div className={styles.textWrapper}>
          <p className={styles.text}>Hey!</p>
          <p className={styles.text}>
            We are onboarding the existing Ambire community first to our newest product - the Ambire
            <strong> browser extension</strong>.
          </p>
          <p className={styles.text}>
            Claim this exclusive invitation code to get early access and start collecting XP for our
            launch campaign before everyone else 🤫
          </p>
        </div>
        <div className={styles.codeWrapper}>
          <span className={styles.codeTitle}>Invitation code</span>
          <span className={styles.code}>{inviteCode}</span>
          <button className={styles.copyButton} type="button" onClick={handleCopy}>
            <CopyIcon />
            <span>Copy</span>
          </button>
        </div>
        <div className={styles.storeWrapper}>
          <p className={styles.storeText}>
            Go to Chrome Web Store, install the extension and use the invitation code to log in.
          </p>
          <a
            className={styles.storeLink}
            href="https://chromewebstore.google.com/detail/ambire-wallet/ehgjhhccekdedpbkifaojjaefeohnoea"
            target="_blank"
            rel="noreferrer"
          >
            <ChromeWebStore />
          </a>
        </div>
      </div>
    </div>
  )
}

export default ExtensionInviteCodeModal
