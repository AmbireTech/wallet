import './StakingMigrateModal.scss'

import { useCallback, useMemo } from 'react'
import { Button, Modal, ToolTip } from '../../common'
import { MdOutlineClose } from 'react-icons/md'
import { useModals, useToasts } from '../../../hooks'
import ERC20ABI from 'adex-protocol-eth/abi/ERC20.json'
import { utils, Contract, getDefaultProvider } from 'ethers'
import networks from '../../../consts/networks'

const ERC20Interface = new utils.Interface(ERC20ABI)

const StakingMigrateModal = ({ balances, account, addRequest }) => {
    const { addToast } = useToasts()
    const { hideModal } = useModals()

    const network = networks.find(({ id }) => id === 'ethereum')
    const accountId = account.id
    const signer = account.signer
    const { rpc, chainId } = network
    const provider = useMemo(() => getDefaultProvider(rpc), [rpc])

    const addRequestTxn = useCallback(
        (id, txn, extraGas = 0) =>
            addRequest({ id, type: 'eth_sendTransaction', chainId: chainId, account: accountId, txn, extraGas }),
        [accountId, addRequest, chainId])


    const approveToken = useCallback(async (token, tokenAddress, bigNumberHexAmount) => {
        try {
            const tokenContract = new Contract(tokenAddress, ERC20Interface, provider)
            const allowance = await tokenContract.allowance(accountId, tokenAddress)

            if (allowance.lt(bigNumberHexAmount)) {
                addRequestTxn(`signer_approve_${token}_migration_${Date.now()}`, {
                    to: tokenAddress,
                    value: '0x0',
                    data: ERC20Interface.encodeFunctionData('approve', [accountId, bigNumberHexAmount])
                })
            }
        } catch (e) {
            console.error(e)
            addToast(`Signer Approve ${token} Error: ${e.message || e}`, { error: true })
        }
    }, [accountId, addRequestTxn, addToast, provider])


    const onMigrate = useCallback(async ({ token, address, balance }) => {
        try {
            approveToken(token, address, balance)
            addRequestTxn(`signer_transfer_${token}_migration_${Date.now()}`, {
                to: address,
                value: '0x0',
                data: ERC20ABI.encodeFunctionData('transferFrom', [signer, accountId, balance.toHexString()])
            })
        } catch (e) {
            console.error(e)
            addToast(`Signer ${token} migration transfer Error: ${e.message || e}`, { error: true })
        }
    }, [accountId, addRequestTxn, addToast, approveToken, signer])

    const migrateButton = ({ token, address, balance }) => <>
        <ToolTip label="Migrate current signer balances to Ambire wallet to farm WALLET token">
            <Button small clear onClick={() => onMigrate({ token, address, balance })}>Migrate {token}</Button>
        </ToolTip>
    </>

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="adx-staking-migrate-modal" title="ADX-STAKING Migration" buttons={modalButtons}>
            {
                balances.map(({ token, address, balance }) =>
                    <div className="item" key={address}>
                        <div className="details">
                            <label>{token}</label>
                            <div className="balance">
                                <div className="amount">
                                    <span className="primary-accent">
                                        {balance.toString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="actions">
                            {migrateButton({ token, address, balance })}
                        </div>
                    </div>
                )
            }

            <div id="info">

            </div>
        </Modal>
    )
}

export default StakingMigrateModal