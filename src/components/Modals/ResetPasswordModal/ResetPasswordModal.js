import { useState, useMemo, createRef, useCallback, useEffect } from 'react'
import { Wallet } from 'ethers'
import { id } from 'ethers/lib/utils'
import accountPresets from 'ambire-common/src/constants/accountPresets'

import buildRecoveryBundle from 'lib/recoveryBundle'
import { fetchPost } from 'lib/fetch'

import { useModals, useCheckPasswordStrength } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { Modal, Radios, Checkbox, Button, ToolTip, Loading, PasswordInput } from 'components/common'

import { MdOutlineHelpOutline } from 'react-icons/md'

import PasswordStrength from 'components/AddAccount/Form/PasswordStrength/PasswordStrength'
import { checkHaveIbeenPwned } from 'components/AddAccount/passwordChecks'
import styles from './ResetPasswordModal.module.scss'

const onFocusOrUnfocus = (e, setIsFocused, state) => {
  if (e.currentTarget === e.target) {
    setIsFocused(state)
  }
}

const ResetPassword = ({ account, selectedNetwork, relayerURL, onAddAccount, showSendTxns }) => {
  const { hideModal } = useModals()
  const { addToast } = useToasts()

  const [isLoading, setLoading] = useState(false)
  const [type, setType] = useState(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [disabled, setDisabled] = useState(true)
  const [isPasswordBreached, setIsPasswordBreached] = useState(false)

  const [isFocused, setIsFocused] = useState(false)

  const { passwordStrength } = useCheckPasswordStrength({
    passphrase: newPassword,
    passphraseConfirm: newPasswordConfirm
  })

  const radios = useMemo(
    () => [
      {
        label:
          'Change the password on this device and Ambire Cloud. Best if you just want to routinely change the password.',
        value: 'change',
        disabled: !account.primaryKeyBackup
      },
      {
        label:
          "Reset the key and password: takes 3 days. Chose this if you've forgotten the old password.",
        value: 'reset'
      }
    ],
    [account.primaryKeyBackup]
  )

  const checkboxes = useMemo(
    () => [
      [
        {
          label: (
            <>
              I understand the following: the new password will be required for subsequent logins,
              but places where you're already logged in will work with the old password until you
              re-login.
              <ToolTip
                className="tooltip"
                label="This is because, for security reasons, the encrypted key is retrieved only when logging in, so we have no way of forcing every device to update it.
                            If you want to disable access for other devices, consider the next option."
              >
                <MdOutlineHelpOutline />
              </ToolTip>
            </>
          ),
          ref: createRef()
        }
      ],
      [
        {
          label: (
            <>
              I understand I am only changing the password on the {selectedNetwork.name} network.
              <ToolTip
                className="tooltip"
                label="You will be able to trigger the change for other networks by switching the network"
              >
                <MdOutlineHelpOutline />
              </ToolTip>
            </>
          ),
          ref: createRef()
        },
        {
          label: 'I understand I need to wait for 3 days for the change to be finalized.',
          ref: createRef()
        }
      ]
    ],
    [selectedNetwork.name]
  )

  const onRadioChange = (value) => {
    setType(value)
    setOldPassword('')
    setNewPassword('')
    setNewPasswordConfirm('')
  }

  const changePassword = async () => {
    setLoading(true)
    // let react do one tick of rerendering before we block on .encrypt/.signMessage
    await new Promise((resolve) => setTimeout(resolve))

    try {
      const wallet = await Wallet.fromEncryptedJson(
        JSON.parse(account.primaryKeyBackup),
        oldPassword
      )
      const primaryKeyBackup = JSON.stringify(
        await wallet.encrypt(newPassword, accountPresets.encryptionOpts)
      )
      const sig = await wallet.signMessage(
        JSON.stringify({ primaryKeyBackup, quickAccSigner: account.signer })
      )
      const resp = await fetchPost(`${relayerURL}/identity/${account.id}/modify`, {
        primaryKeyBackup,
        quickAccSigner: account.signer,
        sig
      })

      if (resp.success) {
        onAddAccount({ ...account, primaryKeyBackup })
        addToast('You password was successfully updated')
        setLoading(false)
        hideModal()
      } else {
        throw new Error(`Unable to update account: ${resp.message || 'unknown error'}`)
      }
    } catch (e) {
      console.error(e)
      addToast(`Changing password error: ${e.message || e}`, { error: true })
    }

    setLoading(false)
  }

  const resetPassword = async () => {
    setLoading(true)
    // let react do one tick of rerendering before we block on .encrypt/.signMessage
    await new Promise((resolve) => setTimeout(resolve))

    try {
      // @TODO: move extraEntropy to a util
      const extraEntropy = id(
        `${account.email}:${Date.now()}:${Math.random()}:${
          typeof performance === 'object' && performance.now()
        }`
      )
      const firstKeyWallet = Wallet.createRandom({ extraEntropy })

      const { quickAccManager, quickAccTimelock, encryptionOpts } = accountPresets
      const signer = {
        quickAccManager,
        timelock: quickAccTimelock,
        one: firstKeyWallet.address,
        two: account.signer.two,
        preRecovery: account.signer
      }

      const primaryKeyBackup = JSON.stringify(
        await firstKeyWallet.encrypt(newPassword, encryptionOpts)
      )

      const bundle = buildRecoveryBundle(account.id, selectedNetwork.id, signer.preRecovery, {
        signer,
        primaryKeyBackup
      })
      hideModal()
      showSendTxns(bundle, true)
      onAddAccount(
        {
          ...account,
          primaryKeyBackup,
          signer,
          preRecoveryPrimaryKeyBackup: account.primaryKeyBackup
        },
        { select: true }
      )
    } catch (e) {
      console.error(e)
      addToast(`Reset password error: ${e.message || e}`, { error: true })
    }

    setLoading(false)
  }

  const validateForm = useCallback(() => {
    let isOldPasswordNotEmpty = false
    let areCheckboxesChecked = false

    if (type === 'change') {
      isOldPasswordNotEmpty = oldPassword.length
      areCheckboxesChecked = checkboxes[0].every(({ ref }) => ref.current && ref.current.checked)
    }

    if (type === 'reset') {
      isOldPasswordNotEmpty = true // in case of Reset we don't have an Old Password, so we just skip its validation
      areCheckboxesChecked = checkboxes[1].every(({ ref }) => ref.current && ref.current.checked)
    }

    setDisabled(!areCheckboxesChecked || !isOldPasswordNotEmpty || !passwordStrength.satisfied)
  }, [checkboxes, type, oldPassword, passwordStrength.satisfied])

  useEffect(
    () => validateForm(),
    [isLoading, validateForm, oldPassword, newPassword, newPasswordConfirm]
  )

  const onSubmit = async (e) => {
    e.preventDefault()

    const submitFunc = type === 'change' ? changePassword : resetPassword

    const breached = await checkHaveIbeenPwned(newPassword)

    setIsPasswordBreached(breached)

    if (breached) return

    submitFunc()
  }

  const handleGoBack = () => {
    setIsPasswordBreached(false)
  }

  const handleContinueAnyway = () => {
    if (type === 'change') {
      changePassword()
    } else {
      resetPassword()
    }
  }

  return (
    <Modal
      className={styles.wrapper}
      contentClassName={styles.content}
      title="Reset Password"
      buttons={
        !isPasswordBreached ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => hideModal()}>
              Cancel
            </Button>
            <Button size="sm" variant="primaryGradient" disabled={disabled} onClick={onSubmit}>
              Confirm
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="primaryGradient"
              onClick={handleGoBack}
              className={styles.button}
            >
              Go back
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleContinueAnyway}
              className={styles.button}
            >
              Continue anyway
            </Button>
          </>
        )
      }
    >
      {isLoading ? (
        <div className={styles.loadingOverlay}>
          <Loading />
        </div>
      ) : null}
      <Radios radios={radios} onChange={onRadioChange} className={styles.radiosContainer} />
      {type === 'change' || type === 'reset' ? (
        <form>
          {type === 'change' ? (
            <PasswordInput
              className={styles.passwordInput}
              autocomplete="current-password"
              placeholder="Old Password"
              onInput={(value) => setOldPassword(value)}
            />
          ) : null}
          <div className={styles.passwordInputWrapper}>
            <PasswordInput
              className={styles.passwordInput}
              peakPassword
              autocomplete="new-password"
              placeholder="New Password"
              onInput={(value) => setNewPassword(value)}
              onFocus={(e) => onFocusOrUnfocus(e, setIsFocused, true)}
              onBlur={(e) => onFocusOrUnfocus(e, setIsFocused, false)}
            />
            <PasswordStrength
              passwordStrength={passwordStrength}
              hasPassword={newPassword?.length > 0}
              isFocused={isFocused}
            />
          </div>
          <PasswordInput
            className={styles.passwordInput}
            autocomplete="new-password"
            placeholder="Confirm New Password"
            onInput={(value) => setNewPasswordConfirm(value)}
            onFocus={(e) => onFocusOrUnfocus(e, setIsFocused, true)}
            onBlur={(e) => onFocusOrUnfocus(e, setIsFocused, false)}
          />
          {checkboxes[type === 'change' ? 0 : 1].map(({ label, ref }, i) => (
            <Checkbox
              labelClassName="checkbox-label"
              key={`checkbox-${i}`}
              ref={ref}
              label={label}
              onChange={() => validateForm()}
            />
          ))}
        </form>
      ) : null}
      <div id="warnings">
        {type === 'change' && oldPassword.length === 0 ? (
          <div className={styles.warning}>Old Password must be set</div>
        ) : null}
        {isPasswordBreached ? (
          <div className={styles.warning}>
            The password you are trying to use has been found in a data breach. We strongly
            recommend you to use a different password.
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export default ResetPassword
