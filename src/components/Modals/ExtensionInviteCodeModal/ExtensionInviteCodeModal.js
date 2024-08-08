import { useCallback, useEffect, useState } from 'react'
import cn from 'classnames'

import { useModals } from 'hooks'

import { ReactComponent as AmbireLogo } from 'resources/logo-new.svg'
import { ReactComponent as CopyIcon } from 'resources/icons/copy-new.svg'
import { ReactComponent as CloseIcon } from 'resources/icons/close.svg'
import { ReactComponent as ChromeWebStore } from 'resources/chrome-web-store.svg'

import { useToasts } from 'hooks/toasts'
import styles from './ExtensionInviteCodeModal.module.scss'

const CAN_CLOSE_AFTER_MS = 5400

const ExtensionInviteCodeModal = ({ inviteCode, waitForClose = true }) => {
  const { hideModal } = useModals()
  const { addToast } = useToasts()
  const [remainingTime, setRemainingTime] = useState(CAN_CLOSE_AFTER_MS)
  const [canClose, setCanClose] = useState(!waitForClose)

  const handleCloseModal = useCallback(() => {
    if (!canClose) return

    hideModal()
  }, [canClose, hideModal])

  useEffect(() => {
    const startingTime = Date.now()

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startingTime
      const newRemainingTime = CAN_CLOSE_AFTER_MS - elapsedTime
      setRemainingTime(newRemainingTime)

      if (newRemainingTime <= 0) {
        setCanClose(true)
        clearInterval(interval)
      }
    }, 500)

    return () => {
      clearInterval(interval)
    }
  }, [])

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
        <div
          className={cn(styles.closeWrapper, {
            [styles.closeIconEnabled]: canClose
          })}
        >
          {!canClose ? (
            <span className={styles.remainingTime}>
              {remainingTime > 500 ? Math.round(remainingTime / 1000) : 1}
            </span>
          ) : (
            <CloseIcon className={styles.closeIcon} onClick={handleCloseModal} />
          )}
        </div>
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
