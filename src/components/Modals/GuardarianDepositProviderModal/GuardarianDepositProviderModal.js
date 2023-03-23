import { Button, Loading, Modal, TextInput, Select } from 'components/common'
import {useState, useMemo, useCallback} from 'react'
import useGuardarian from './useGuardarian'
import { useToasts } from 'hooks/toasts'
import { ToolTip, NumberInput } from 'components/common'
import { fetchGet } from 'lib/fetch';
import { popupCenter } from 'lib/popupHelper'
import url from 'url'

import { ReactComponent as GuardarianIcon } from 'resources/payment-providers/guardarian-horizontal.svg' 

import styles from './GuardarianDepositProviderModal.module.scss'

const GuardarianDepositProviderModal = ({ relayerURL, walletAddress, selectedNetwork, portfolio, initMode = 'buy', selectedAsset = null }) => {
    const { addToast } = useToasts()
    const guardarian = useGuardarian({relayerURL, selectedNetwork, initMode, tokens: portfolio.tokens, walletAddress, addToast, selectedAsset })

    const selectedToken = guardarian?.cryptoList?.data?.find(({ value }) => value === guardarian.from)
    const selectedTokenInPortfolio = portfolio?.tokens?.find(({ address, symbol }) => address === selectedToken?.address || symbol === selectedToken?.value)
    const [sendTransactionLoading, setSendTransactionLoading] = useState(false)
    const getCurrentTokenFromBalance = useCallback(() => {
        if (portfolio.tokens && guardarian?.cryptoCurrencies?.data && guardarian.mode === 'sell') {
            const token = guardarian?.cryptoCurrencies?.data?.find(t => t.ticker === guardarian.from)
            return portfolio?.tokens?.find(t => token?.networks?.find(nt => (nt?.token_contract?.toLowerCase() === t?.address?.toLowerCase())
                || (nt?.network === guardarian.NETWORK_MAPPING[guardarian.network] && t?.address.toLowerCase() ===  guardarian.NATIVE_ADDRESS && nt?.token_contract === null)))
        }
        else return {}
    }, [guardarian, portfolio.tokens])

    const validationMsg = useMemo(() => {
        const marketData = guardarian?.marketInfo?.data

        // In case of failed market info or estimate requests
        if (guardarian?.marketInfo?.error || guardarian?.estimateInfo?.error) return 'Sorry! We couldn\'t estimate your order! Please try again later!'

        // If there is no market data fetch yet, we can't validate
        if (!marketData) return ''

        const userAmount = parseFloat(guardarian.amount)
        const marketMin = parseFloat(marketData.min)
        const marketMax = parseFloat(marketData.max)

        if (guardarian.mode === 'buy') {
            if (userAmount < marketMin) return `Minimum amount is ${marketData.min} ${marketData.from}`
            if (userAmount > marketMax) return `Maximum amount is ${marketData.max} ${marketData.from}`
        } else if (guardarian.mode === 'sell') {
            const currToken = getCurrentTokenFromBalance()

            if (userAmount < marketMin) return `Minimum amount is ${marketData.min} ${marketData.from}`
            if (userAmount > marketMax) return `Maximum amount is ${marketData.max} ${marketData.from}`
            if (currToken && guardarian?.from && (userAmount > currToken.balance)) return `You do not have enough funds`
        }

        return ''
    }, [guardarian, getCurrentTokenFromBalance])

    function changeFrom(value) {
        guardarian.setFrom(value)
    }

    function changeTo(value) {
        guardarian.setTo(value)
    }

    const onInputAmount = value => {
        guardarian.setAmount(value)
    }

    function sendTxn () {
        setSendTransactionLoading(true)
        fetchGet(guardarian.genTxnUrl())
            .then(({data}) => {
                setSendTransactionLoading(false)
                if (data?.redirect_url) {
                    popupCenter({
                        url: url.format(data?.redirect_url),
                        title: 'Guardarian Deposit',
                        w: 560,
                        h: 710,
                    })
                }
            })
            .catch(e => {
                addToast('Error while trying to send transaction', { error: true })
                setSendTransactionLoading(false)
            })
    }
    const setMaxAmount = () => {
        onInputAmount(selectedTokenInPortfolio?.balance)
    }

    return (
        <Modal 
            size="sm"
            className={styles.wrapper}
            title={guardarian.mode === 'buy' ? 'Buy' : 'Sell'}
        >
            <div className={styles.inputCurrenciesWrapper}>
                <div className={styles.currenciesRowWrapper}>
                    <label className={styles.inputLabel}>You send</label>
                    <p className={styles.inputLabel}>
                    { guardarian?.marketInfo?.data?.min && `Min: ${guardarian?.marketInfo?.data?.min}`}
                    </p>
                </div>
            <div className={styles.currenciesRowWrapper}>

            <div className={styles.amount}>
                <NumberInput
                    value={guardarian.amount}
                    onInput={onInputAmount}
                    button={guardarian.mode === "sell" && selectedTokenInPortfolio ? "MAX" : ""}
                    onButtonClick={() => setMaxAmount()}
                />
            </div>
            <div className={styles.currency}>
                { (guardarian.mode === 'buy' && !guardarian?.fiatList?.isLoading) || (guardarian?.mode === 'sell' && !guardarian?.cryptoList?.isLoading)
                ? <Select 
                className={styles.select}
                selectInputClassName={styles.selectInput}
                iconClassName={styles.selectIcon}
                searchable
                defaultValue={guardarian.from}
                items={guardarian.mode === 'buy' ? guardarian.fiatList.data : guardarian.cryptoList.data}
                onChange={({value}) => changeFrom(value)}/>
                : <div className={styles.loadingWrapper}><Loading /> </div>}
            </div>
            </div>
        </div>
        { (validationMsg !== '') && (<p className={styles.validationMsg}>{ validationMsg }</p>) }

            <div className={styles.estimationInfoWrapper}>
                <div className={styles.extraFees}>
                    <ToolTip label='All the exchange fees are added into the rate. There are no extra costs.'>
                        <p>No extra fees</p>
                    </ToolTip>
                </div>
                <div className={styles.estimationRate}>
                    <ToolTip label='This is expected rate. Guardarian guarantees to pick up the best possible rate on the moment of the exchange'>
                    <p>
                        Estimation rate: {' '}
                        <span>

                        { !guardarian.estimateInfo.isLoading && guardarian?.estimateInfo?.data && validationMsg === ''
                        ? (<>
                        { 1 + guardarian?.estimateInfo?.data?.from_currency} ≈ {guardarian?.estimateInfo?.data?.estimated_exchange_rate} {guardarian?.estimateInfo?.data?.to_currency}
                    </>)
                    : <></>}
                        </span>
                    </p>
                </ToolTip>
                </div>
            </div> 
        <div className={styles.inputCurrenciesWrapper}>
            <div className={styles.currenciesRowWrapper}>

            <div className={styles.amount}>
                <label className={styles.inputLabel}>You get</label>
            </div>
            </div>
            <div className={styles.currenciesRowWrapper}>
                {!guardarian.estimateInfo.isLoading ? <TextInput
                    className={styles.estimateInfoInput}
                    value={guardarian?.estimateInfo?.data ? guardarian?.estimateInfo?.data?.value : ''}
                    disabled
                    /> : <TextInput
                    value='Info...'
                    disabled
                    className={styles.loadingInput}
                    />}
            <div className={styles.currency}>
            { (guardarian?.mode === 'buy' && !guardarian?.cryptoList?.isLoading) || (guardarian?.mode === 'sell' && !guardarian?.fiatList?.isLoading)
                ? <Select
                    selectInputClassName={styles.selectInput}
                    className={styles.select}
                    iconClassName={styles.selectIcon}
                    searchable 
                    defaultValue={guardarian?.to}
                    items={guardarian?.mode === 'sell' ? guardarian?.fiatList?.data : guardarian?.cryptoList?.data} 
                    onChange={({value}) => changeTo(value)}/> 
                    : <div className={styles.loadingWrapper}><Loading /> </div>}
            </div>
            </div>
        </div>
        <Button 
            small
            disabled={
                validationMsg !== '' 
                || guardarian?.marketInfo?.isLoading 
                || guardarian?.estimateInfo?.isLoading 
                || guardarian?.txn?.isLoading
                || guardarian?.amount === ''
                || sendTransactionLoading
            } 
            onClick={sendTxn}
            className={styles.button}
            variant="primaryGradient"
        >
            {guardarian.mode === 'buy' ? 'Buy' : 'Sell'}
        </Button>
        <div className={styles.poweredBy}>
            <label className={styles.poweredByLabel}>Powered by: </label>
            <GuardarianIcon className={styles.poweredByLogo} />
        </div>
        </Modal>
    )
}                    

export default GuardarianDepositProviderModal