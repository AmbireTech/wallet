import { RiDragDropLine } from 'react-icons/ri'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loading, Panel, Alert } from 'components/common'
import { AbiCoder, keccak256 } from 'ethers/lib/utils'
import cn from 'classnames'
import { useRelayerData } from 'hooks'
import { useToasts } from 'hooks/toasts'
import { useDropzone } from 'react-dropzone'
import { validateImportedAccountProps, fileSizeValidator } from 'lib/validations/importedAccountValidations'
import Backup from './Backup/Backup'
import PendingRecoveryNotice from './PendingRecoveryNotice/PendingRecoveryNotice'
import Signers from './Signers/Signers'

import styles from './Security.module.scss'

const REFRESH_INTVL = 40000

const Security = ({
  relayerURL,
  selectedAcc,
  selectedNetwork,
  accounts,
  addRequest,
  showSendTxns,
  onAddAccount
}) => {
  const [ cacheBreak, setCacheBreak ] = useState(() => Date.now())
  
  useEffect(() => {
    if (Date.now() - cacheBreak > 30000) setCacheBreak(Date.now())
    const intvl = setTimeout(() => setCacheBreak(Date.now()), REFRESH_INTVL)
    return () => clearTimeout(intvl)
  }, [cacheBreak])

  const url = relayerURL
    ? `${relayerURL}/identity/${selectedAcc}/${selectedNetwork.id}/privileges?cacheBreak=${cacheBreak}`
    : null
  const { data, errMsg, isLoading } = useRelayerData({ url })
  const privileges = useMemo(() => data ? data.privileges : {}, [data])
  // We are converting the privileges to an alphabetically sorted list, in order to map and render them easily.
  // Also, we are sorting it via `a[0].localeCompare(b[0])` in order to keep the same sorting order,
  // as it was in the privileges object before that (returned by Relayer).
  const privilegesList = useMemo(() => Object.entries(privileges).sort((a, b) => a[0].localeCompare(b[0])), [privileges])
  const recoveryLock = data && data.recoveryLock
  const { addToast } = useToasts()
  const selectedAccount = accounts.find(x => x.id === selectedAcc)
  
  // JSON import
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    const reader = new FileReader()
    
    if (rejectedFiles.length) {
      addToast(`${rejectedFiles[0].file.path} - ${(rejectedFiles[0].file.size / 1024).toFixed(2)} KB. ${rejectedFiles[0].errors[0].message}`, { error: true })
    }

    if (acceptedFiles.length){
      const file = acceptedFiles[0]

      reader.readAsText(file,'UTF-8')
      reader.onload = readerEvent => {
        const content = readerEvent.target.result
        const fileContent = JSON.parse(content)
        const validatedFile = validateImportedAccountProps(fileContent)
        
        if (validatedFile.success) onAddAccount(fileContent, { select: true })
        else addToast(validatedFile.message, { error: true})
      }
    }
  }, [addToast, onAddAccount])
  const { getRootProps, getInputProps, open, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: 'application/json',
    maxFiles: 1,
    validator: fileSizeValidator
  })

  // @TODO relayerless mode: it's not that hard to implement in a primitive form, we need everything as-is
  // but rendering the initial privileges instead; or maybe using the relayerless transactions hook/service
  // and aggregate from that
  const accHash = signer => {
      const abiCoder = new AbiCoder()
      const { timelock, one, two } = signer
      return keccak256(abiCoder.encode(['tuple(uint, address, address)'], [[timelock, one, two]]))
  }
  const hasPendingReset = privileges[selectedAccount.signer.quickAccManager] && (
    (recoveryLock && recoveryLock.status && !isLoading)
      || (
          privileges && selectedAccount.signer.quickAccManager
          // is or has been in recovery state
          && selectedAccount.signer.preRecovery
          // but that's not finalized yet
          && accHash(selectedAccount.signer) !== privileges[selectedAccount.signer.quickAccManager]
      )
  )

  const showLoading = isLoading && !data
  const signersFragment = relayerURL ? (
  <div>
    <Alert
      className={styles.alert}
      title="Please note:"
      text={<>Signer settings are network-specific. You are currently looking at and modifying the signers on {selectedNetwork.name}.{' '}
        <a
          href='https://help.ambire.com/hc/en-us/articles/4410885684242-Signers' 
          target='_blank' 
          rel='noreferrer'
          className={styles.link}
        >
          Need help? Click here.
        </a>
      </>}
    />
    <Panel className={styles.panel} title="Authorized signers" titleClassName={styles.title}>
      {hasPendingReset && !showLoading && (<PendingRecoveryNotice
        recoveryLock={recoveryLock}
        showSendTxns={showSendTxns}
        selectedAccount={selectedAccount}
        selectedNetwork={selectedNetwork}
      />)}
      {errMsg && (
        <h3 className={styles.error}>Error getting authorized signers: {errMsg}</h3>
      )}
      {(!showLoading && privilegesList.length) ? <Signers 
        relayerURL={relayerURL}
        relayerData={data} 
        signers={privilegesList} 
        onAddAccount={onAddAccount}
        cacheBreak={cacheBreak}
        setCacheBreak={setCacheBreak}
        selectedAcc={selectedAcc}
        selectedAccount={selectedAccount}
        selectedNetwork={selectedNetwork}
        addRequest={addRequest}
        showSendTxns={showSendTxns}
        hasPendingReset={hasPendingReset}
      /> : <Loading />}
    </Panel>
  </div>) : (
    <Panel className={styles.panel} title="Authorized signers">
      <h3 className={styles.error}>
        Unsupported: not connected to a relayer.
      </h3>
    </Panel>
  )
  return (
    <section className={cn(
      styles.wrapper,
      {
        [styles.activeStyle]: isDragActive,
        [styles.acceptStyle]: isDragAccept,
        [styles.rejectStyle]: isDragReject
      })
    }
      {...getRootProps()}
    >
      {
        (isDragAccept || isDragReject)
        && (<div className={isDragAccept ? styles.acceptStyleIcon : styles.rejectStyleIcon}><RiDragDropLine size={100}/></div>)
      }
      
      <input {...getInputProps()} />
      {signersFragment}

      <Backup 
        selectedAccount={selectedAccount}
        onOpen={open}
        onAddAccount={onAddAccount}
      />
    </section>
  )
}

export default Security
