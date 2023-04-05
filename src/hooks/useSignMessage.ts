// @ts-nocheck
// nocheck because the TS warnings are logged in the dev console
// TODO: TS setup fix: stop the TS logs and then remove the nocheck
import { signMessage, signMessage712 } from 'adex-protocol-eth/js/Bundle'
import { NetworkType } from 'ambire-common/src/constants/networks'
import { Wallet } from 'ethers'
import { arrayify, isHexString, toUtf8Bytes } from 'ethers/lib/utils'
import { useCallback, useMemo, useState } from 'react'

import { verifyMessage } from '@ambire/signature-validator'
import { getWallet } from 'lib/getWallet'

import { getNetworkByChainId } from 'ambire-common/src/services/getNetwork'
import { getProvider } from 'ambire-common/src/services/provider'
import useAccSignMsgStatus from 'ambire-common/src/hooks/useAccSignMsgStatus'
import useGetMsgType from 'ambire-common/src/hooks/useGetMsgType'
import useSignedMsgs from 'ambire-common/src/hooks/useSignedMsgs'
import { fetchPost } from 'lib/fetch'
import { UseStorageProps } from 'ambire-common/src/hooks/useStorage'
import { useToasts } from 'hooks/toasts'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'

export type UseSignMessageProps = {
  account: UseAccountsReturnType['account']
  messagesToSign: any[]
  relayerURL?: string
  resolve: (outcome: any) => void
  onConfirmationCodeRequired: (
    confCodeRequired?: 'email' | 'otp' | null,
    approveQuickAcc?: (confCode: number) => void
  ) => Promise<any>
  useStorage: Omit<UseStorageProps<any>, 'storage'>
}

export type UseSignMessageReturnType = {
  approve: (credentials: any, device?: any) => Promise<any>
  approveQuickAcc: (credentials: any) => Promise<any>
  msgToSign: any
  isLoading: boolean
  hasPrivileges: boolean | null
  typeDataErr: any
  isDeployed: boolean | null
  dataV4: any
  requestedNetwork: NetworkType | undefined
  requestedChainId: NetworkType['chainId']
  isTypedData: boolean
  confirmationType: 'email' | 'otp' | null
  verifySignature: (msgToSign: any, sig: any, networkId: any) => Promise<any>
  dApp: {
    name: string
    description: string
    url: string
    icons: string[]
  }
}

function getMessageAsBytes(msg: string) {
  // Transforming human message / hex string to bytes
  if (!isHexString(msg)) {
    return toUtf8Bytes(msg)
  }
  return arrayify(msg)
}

const useSignMessage = ({
  account,
  messagesToSign,
  relayerURL,
  resolve,
  onConfirmationCodeRequired,
  useStorage
}: UseSignMessageProps): UseSignMessageReturnType => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const [confirmationType, setConfirmationType] = useState<'email' | 'otp' | null>(null)

  const { addToast } = useToasts()
  const msgToSign = useMemo(() => messagesToSign[0] || {}, [messagesToSign])

  const dApp = msgToSign.dapp

  const { typeDataErr, requestedChainId, dataV4, isTypedData } = useGetMsgType({ msgToSign })

  const requestedNetwork = getNetworkByChainId(requestedChainId)

  const { addSignedMessage } = useSignedMsgs({ useStorage })

  const { isDeployed, hasPrivileges } = useAccSignMsgStatus({
    fetch,
    addToast,
    accountId: account?.id,
    accountSigner: account?.signer,
    networkId: requestedNetwork?.id as NetworkType['id']
  })

  const handleSigningErr = useCallback(
    (e: any) => {
      if (e && e.message.includes('must provide an Ethereum address')) {
        addToast(
          `Signing error: not connected with the correct address. Make sure you're connected with ${account.signer?.address}.`,
          { error: true }
        )
      } else {
        addToast(`Signing error: ${e.message || e}`, {
          error: true
        })
      }
    },
    [account, addToast]
  )

  const verifySignature = useCallback(
    (msgToSign, sig, networkId) => {
      const provider = getProvider(networkId)
      return verifyMessage({
        provider,
        signer: account.id,
        message: isTypedData ? null : getMessageAsBytes(msgToSign.txn),
        typedData: isTypedData ? dataV4 : null,
        signature: sig
      })
        .then((verificationResult: any) => {
          if (verificationResult) {
            addToast('Signature valid - successfully signed!')
          } else {
            addToast(`${msgToSign.type} Signature invalid!`, { error: true })
          }
        })
        .catch((e: any) => {
          addToast(`${msgToSign.type} Signature invalid: ${e.message}`, { error: true })
        })
    },
    [account, addToast, dataV4, isTypedData]
  )

  const approveQuickAcc = useCallback(
    async (credentials: any) => {
      if (!relayerURL) {
        addToast('Email/pass accounts not supported without a relayer connection', {
          error: true
        })
        return
      }
      if (!credentials.password) {
        addToast('Password required to unlock the account', { error: true })
        return
      }
      setLoading(true)
      try {
        const { signature, success, message, confCodeRequired } = await fetchPost(
          `${relayerURL}/second-key/${account.id}/ethereum/sign${
            isTypedData ? '?typedData=true' : ''
          }`,
          {
            toSign: isTypedData ? dataV4 : msgToSign.txn,
            code: credentials.code?.length ? credentials.code : undefined
          }
        )
        if (!success) {
          setLoading(false)
          if (!message) throw new Error('Secondary key: no success but no error message')
          if (message.includes('invalid confirmation code')) {
            addToast('Unable to sign: wrong confirmation code', { error: true })
          }
          addToast(`Second signature error: ${message}`, {
            error: true
          })
          setConfirmationType(null)
          setLoading(false)

          return
        }
        if (confCodeRequired) {
          setConfirmationType(confCodeRequired)

          if (onConfirmationCodeRequired) {
            await onConfirmationCodeRequired(confCodeRequired, approveQuickAcc)
          }

          setLoading(false)
          return
        }

        if (!account.primaryKeyBackup)
          throw new Error(
            'No key backup found: you need to import the account from JSON or login again.'
          )
        const wallet = await Wallet.fromEncryptedJson(
          JSON.parse(account.primaryKeyBackup),
          credentials.password
        )
        const sig = await (isTypedData
          ? signMessage712(
              wallet,
              account.id,
              account.signer,
              dataV4.domain,
              dataV4.types,
              dataV4.message,
              signature
            )
          : signMessage(
              wallet,
              account.id,
              account.signer,
              getMessageAsBytes(msgToSign.txn),
              signature
            ))

        await verifySignature(msgToSign, sig, requestedNetwork?.id)

        addSignedMessage({
          accountId: account.id,
          networkId: requestedChainId,
          date: new Date().getTime(),
          typed: isTypedData,
          signer: account.signer,
          message: msgToSign.txn,
          signature: sig,
          dApp
        })

        // keeping resolve at the very end, because it can trigger components unmounting, and code after resolve may or may not run
        resolve({ success: true, result: sig })
      } catch (e) {
        handleSigningErr(e)
      }
      setLoading(false)
    },
    [
      account,
      addToast,
      dataV4,
      handleSigningErr,
      isTypedData,
      onConfirmationCodeRequired,
      relayerURL,
      requestedNetwork,
      resolve,
      msgToSign,
      verifySignature,
      dApp,
      requestedChainId,
      addSignedMessage
    ]
  )
  // Passing hardware device is required only for the mobile app
  const approve = useCallback(
    async (credentials: any, device?: any) => {
      if (account.signer?.quickAccManager) {
        await approveQuickAcc(credentials)
        return
      }
      setLoading(true)

      try {
        const wallet = getWallet({
          signer: account.signer,
          signerExtra: account.signerExtra,
          chainId: 1 // does not matter
        })

        if (!wallet) {
          return
        }

        // It would be great if we could pass the full data cause then web3 wallets/hw wallets can display the full text
        // Unfortunately that isn't possible, because isValidSignature only takes a bytes32 hash; so to sign this with
        // a personal message, we need to be signing the hash itself as binary data such that we match 'Ethereum signed message:\n32<hash binary data>' on the contract

        const sig = await (isTypedData
          ? signMessage712(
              wallet,
              account.id,
              account.signer,
              dataV4.domain,
              dataV4.types,
              dataV4.message
            )
          : signMessage(wallet, account.id, account.signer, getMessageAsBytes(msgToSign.txn)))

        await verifySignature(msgToSign, sig, requestedNetwork?.id)

        addSignedMessage({
          accountId: account.id,
          networkId: requestedChainId,
          date: new Date().getTime(),
          typed: isTypedData,
          signer: account.signer,
          message: msgToSign.txn,
          signature: sig,
          dApp
        })

        // keeping resolve at the very end, because it can trigger components unmounting, and code after resolve may or may not run
        resolve({ success: true, result: sig })
      } catch (e) {
        handleSigningErr(e)
      }
      setLoading(false)
    },
    [
      account,
      approveQuickAcc,
      dataV4,
      handleSigningErr,
      requestedNetwork?.id,
      resolve,
      msgToSign,
      isTypedData,
      verifySignature,
      addSignedMessage,
      dApp,
      requestedChainId
    ]
  )

  return {
    approve,
    approveQuickAcc,
    msgToSign,
    isLoading,
    hasPrivileges,
    typeDataErr,
    isDeployed,
    dataV4,
    requestedNetwork,
    requestedChainId,
    isTypedData,
    confirmationType,
    verifySignature,
    dApp
  }
}

export default useSignMessage
