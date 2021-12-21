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
    const signerAddress = account.signer.address

    const { rpc, chainId } = network
    const provider = useMemo(() => getDefaultProvider(rpc), [rpc])

    const addRequestTxn = useCallback(
        (id, txn, extraGas = 0) =>
            addRequest({ id, type: 'eth_sendTransaction', chainId: chainId, account: accountId, txn, extraGas }),
        [accountId, addRequest, chainId])


    const approveToken = useCallback(async (symbol, tokenAddress, bigNumberHexAmount) => {
        try {
            const tokenContract = new Contract(tokenAddress, ERC20Interface, provider)
            const allowance = await tokenContract.allowance(accountId, tokenAddress)

            if (allowance.lt(bigNumberHexAmount)) {
                addRequestTxn(`signer_approve_${symbol}_migration_${Date.now()}`, {
                    to: tokenAddress,
                    value: '0x0',
                    data: ERC20Interface.encodeFunctionData('approve', [accountId, bigNumberHexAmount])
                })
            }
        } catch (e) {
            console.error(e)
            addToast(`Signer Approve ${symbol} Error: ${e.message || e}`, { error: true })
        }
    }, [accountId, addRequestTxn, addToast, provider])


    const onMigrate = useCallback(async ({ symbol, address, balance }) => {
        try {
            await approveToken(symbol, address, balance)
            addRequestTxn(`signer_transfer_${symbol}_migration_${Date.now()}`, {
                to: address,
                value: '0x0',
                data: ERC20Interface.encodeFunctionData('transferFrom', [signerAddress, accountId, balance.toHexString()])
            })
        } catch (e) {
            console.error(e)
            addToast(`Signer ${symbol} migration transfer Error: ${e.message || e}`, { error: true })
        }
    }, [accountId, addRequestTxn, addToast, approveToken, signerAddress])

    const migrateButton = ({ symbol, address, balance }) => <>
        <ToolTip label="Migrate current signer balances to Ambire wallet to farm WALLET token">
            <Button small clear onClick={() => onMigrate({ symbol, address, balance })}>Migrate {symbol}</Button>
        </ToolTip>
    </>

    const modalButtons = <>
        <Button clear icon={<MdOutlineClose />} onClick={() => hideModal()}>Close</Button>
    </>

    return (
        <Modal id="adx-staking-migrate-modal" title="Migrate ADX stakings" buttons={modalButtons}>
            {
                balances.map(({ symbol, address, balance, decimals }) =>
                    <div className="item" key={address}>
                        <div className="details">
                            <label>{symbol}</label>
                            <div className="balance">
                                <div className="amount">
                                    <span className="primary-accent">
                                        {utils.formatUnits(balance, decimals)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="actions">
                            {migrateButton({ symbol, address, balance })}
                        </div>
                    </div>
                )
            }

            <div id="info">
                {`Migrate your ADX stakigs tokens to your Ambire wallet and start earning $WALLET tokens `}
                <a href="https://blog.ambire.com/announcing-the-wallet-token-a137aeda9747" target="_blank" rel="noreferrer">Read More</a>
           
            </div>
        </Modal>
    )
}

export default StakingMigrateModal