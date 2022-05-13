import './SignatureSandbox.scss';

import { useCallback, useState } from 'react';
import { _TypedDataEncoder } from 'ethers/lib.esm/utils'
import { ethers } from 'ethers'

import { getProvider } from 'lib/provider'
import { verifyMessage } from 'lib/signatureVerifier'
import { Button, TextInput } from 'components/common'

export const MESSAGE_TYPE = [
  { name: "dest", type: "address" },
  { name: "content", type: "string" },
]

export default function SignatureSandbox({ addRequest, selectedAcc, network, accounts }) {

  const [message, setMessage] = useState(null)
  const [signedMessage, setSignedMessage] = useState(null)
  const [signatureDebug, setSignatureDebug] = useState(null)

  const [selectedTab, setSelectedTab] = useState('sign')

  const [error, setError] = useState(null)

  const [signatureVerifierData, setSignatureVerifierData] = useState(null)
  const [verifySignatureResult, setVerifySignatureResult] = useState(null)

  const [signerToVerify, setSignerToVerify] = useState(null)
  const [signatureToVerify, setSignatureToVerify] = useState(null)

  const generateTypedMessage = useCallback( (msg) => {
    return {
      types: {
        TypedMessage: MESSAGE_TYPE,
      },
      domain: {
        name: "Ambire sandbox",
        chainId: network.chainId,
        verifyingContract: '0xdFfc9812FE60596c997511DE0087749a25E52C88',
      },
      primaryType: 'TypedMessage',
      message: {
        dest: '0x12C83524DAbAe332CC2aF16b97745aF9Ea2761FA',
        content: msg
      },
    }
  }, [network])

  const signMessage = useCallback((signType) => {

    let txn

    if (signType === 'eth_sign') {
      txn = message
      setSignatureVerifierData(message)
    } else {
      txn = generateTypedMessage(message)
      setSignatureDebug(old => ({
        genMsg: txn,
        hash: _TypedDataEncoder.hash(txn.domain, txn.types, txn.message)
      }))
      setSignatureVerifierData(old => JSON.stringify(txn, '\n', ' '))
    }

    setError(null)
    addRequest({
        id: 'sandbox_' + Math.random(),
        type: signType,
        txn: txn,
        chainId: network.chainId,
        account: selectedAcc,
        callback: (cb) => {
          console.log(cb)
          if (cb.success) {
            setSignedMessage(cb.result)
            setSignatureToVerify(cb.result)
          } else {
            setError(cb.message)
          }
        }
      })
  }, [message, addRequest, selectedAcc, network, generateTypedMessage])


  //Undeployed implemenatation
  const ambireUndeployedValidationCallback = useCallback((signer, hash, sig) => {

    //override signer var as the signer is actually the signer, not identity
    const x = accounts.find(a => a.id.toLowerCase() === signer.toLowerCase())
    if (!x) return false
    if (x.signer.address) {
      signer = x.signer.address
    } else {
      signer = x.signer.two
    }

    const ambireUndeployedQuickAccCheck = (signer, hash, sig) => {
      const decoded = ethers.utils.defaultAbiCoder.decode([
        'uint',
        'bytes',
        'bytes'
      ], sig)

      const sig1 = decoded[1]
      const sig2 = decoded[2]

      const b1 = Buffer.from(sig1.substr(2), 'hex')
      const subMode1 = b1[b1.length - 1]

      const b2 = Buffer.from(sig2.substr(2), 'hex')
      const subMode2 = b2[b2.length - 1]

      return ambireUndeployedStandardCheck(signer, hash, sig1, subMode1 === 1) || ambireUndeployedStandardCheck(signer, hash, sig2, subMode2 === 1)
    }

    const ambireUndeployedStandardCheck = (signer, message, sig, isMessage) => {
      const b = Buffer.from(sig.substr(2), 'hex')
      const v = b[64]

      if (v !== 27 && v !== 28) return false

      if (isMessage) {
        hash = ethers.utils.keccak256(ethers.utils.solidityPack(['string', 'bytes32'],['\x19Ethereum Signed Message:\n32', hash]))
      }

      const recoveredSigner = ethers.utils.recoverAddress(hash, '0x' + b.slice(0, 65).toString('hex'))

      if (!recoveredSigner) {
        return false
      }
      return recoveredSigner.toLowerCase() === signer.toLowerCase();
    }

    const b = Buffer.from(sig.substr(2), 'hex')
    const mode = b[b.length - 1]

    if (mode === 0 || mode === 1) {
      return ambireUndeployedStandardCheck(signer, hash, '0x' + b.slice(0, 65).toString('hex'), mode === 1)
    } else if (mode === 2) {
      //need deployed contract as privileges are checked, but we can still check one of the signer
      return ambireUndeployedQuickAccCheck(signer, hash, sig)
    } else {
      return false
    }
  }, [accounts])


  const verifySignatureStandard = useCallback(() => {
    setVerifySignatureResult(null)
    const provider = getProvider(network.id)

    verifyMessage({
      provider,
      signer: signerToVerify,
      message: signatureVerifierData,
      signature: signatureToVerify,
      undeployedCallback: ambireUndeployedValidationCallback
    })
      .then(setVerifySignatureResult)
      .catch(e => {
        setVerifySignatureResult(old => ({
          success: false,
          error: e.message
        }))
      })

  }, [ambireUndeployedValidationCallback, network, signatureToVerify, signatureVerifierData, signerToVerify])

  const verifySignatureStandardAsBytes = useCallback(() => {
    setVerifySignatureResult(null)
    const provider = getProvider(network.id)

    verifyMessage({
      provider,
      signer: signerToVerify,
      message: ethers.utils.arrayify(signatureVerifierData),
      signature: signatureToVerify,
      undeployedCallback: ambireUndeployedValidationCallback
    })
      .then(setVerifySignatureResult)
      .catch(e => {
        setVerifySignatureResult(old => ({
          success: false,
          error: e.message
        }))
      })

  }, [ambireUndeployedValidationCallback, network, signatureToVerify, signatureVerifierData, signerToVerify])

  const verifySignatureRaw = useCallback(() => {
    setVerifySignatureResult(null)
    const provider = getProvider(network.id)

    verifyMessage({
      provider,
      signer: signerToVerify,
      finalDigest: signatureVerifierData,
      signature: signatureToVerify,
      undeployedCallback: ambireUndeployedValidationCallback
    })
      .then(setVerifySignatureResult)
      .catch(e => {
        setVerifySignatureResult(old => ({
          success: false,
          error: e.message
        }))
      })

  }, [ambireUndeployedValidationCallback, network, signatureToVerify, signatureVerifierData, signerToVerify])

  const verify712 = useCallback(() => {
    debugger
    let typed = {}
    try {
      typed = JSON.parse(signatureVerifierData)
    } catch {
      setError('invalid data type')
      return
    }

    setVerifySignatureResult(null)
    const provider = getProvider(network.id)

    verifyMessage({
      provider,
      signer: signerToVerify,
      typedData: typed,
      signature: signatureToVerify,
      undeployedCallback: ambireUndeployedValidationCallback
    })
      .then(setVerifySignatureResult)
      .catch(e => {
        setVerifySignatureResult(old => ({
          success: false,
          error: e.message
        }))
      })

  }, [ambireUndeployedValidationCallback, network, signatureToVerify, signatureVerifierData, signerToVerify])

  return (
    <section id='sandbox'>
      {
        error &&
        <div class={'hollow danger'}>
          ERR : {error}
        </div>
      }

      <div className='tabs'>
        <a onClick={() => setSelectedTab('sign')} className={selectedTab === 'sign' && 'selected'}>Sign</a>
        <a onClick={() => setSelectedTab('verify')} className={selectedTab === 'verify' && 'selected'}>Verify</a>
      </div>

      {
        selectedTab === 'sign' &&
        <>
          <div className={'signForm'}>
            <TextInput
              placeholder="Text message (712 will wrap this message into a test TypedData obj"
              onChange={(val) => {
                setMessage(val)
              }}/>

            <div className={'buttonRow'}>
              <Button onClick={() => {
                signMessage('eth_signTypedData_v4')
              }}>712 Sign</Button>

              <Button onClick={() => {
                signMessage('eth_sign')
              }}>EthSign</Button>
            </div>
          </div>

          {
            signatureDebug &&
            <div class={'hollow success'}>
              <div>Hashed Message/TypedData : {signatureDebug.hash}</div>
            </div>
          }
          {
            signedMessage &&
            <div class={'hollow success'}>Sig : {signedMessage}</div>
          }
        </>
      }

      {
        selectedTab === 'verify' &&
        <div className={'verifyForm'}>

          <textarea cols='30' rows='10' onChange={(e) => setSignatureVerifierData(e.target.value)} value={signatureVerifierData} />

          <label>Signer address</label>
          <TextInput
            placeholder={'signer'}
            onChange={(val) => {
              setSignerToVerify(val)
            }} value={signerToVerify}
          />

          <label>Signature to verify</label>
          <TextInput
            placeholder={'signature'}
            onChange={(val) => {
              setSignatureToVerify(val)
            }} value={signatureToVerify}
          />

          <div className={'buttonRow'}>
            <Button onClick={() => {verify712()}}>Verify 712</Button>
            <Button onClick={() => {verifySignatureStandard()}}>Verify Standard</Button>
            <Button onClick={() => {verifySignatureStandardAsBytes()}}>Verify As hex</Button>
            <Button onClick={() => {verifySignatureRaw()}}>Verify Raw</Button>
          </div>

          {
            verifySignatureResult &&
            <>
              {
                verifySignatureResult.success
                  ? <div className={'hollow success'}>Verification OK ({verifySignatureResult.type})</div>
                  : <div className={'hollow danger'}>Verification {verifySignatureResult.error ? `Failed: ${verifySignatureResult.error}` : 'NOT OK'}</div>
              }
            </>
          }
        </div>
      }


    </section>
  )
}
