import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchGet } from 'lib/fetch';
import { useToasts } from 'hooks/toasts'

const OFF_RAMP_FIAT = [
    {
        label: 'EUR',
        value: 'EUR',
        icon: `https://changenow.io/images/sprite/currencies/eur.svg`
    },
    {
        label: 'GBP',
        value: 'GBP',
        icon: `https://changenow.io/images/sprite/currencies/gbp.svg`
    },
    {
        label: 'USD',
        value: 'USD',
        icon: `https://changenow.io/images/sprite/currencies/usd.svg`
    }
]

const NETWORK_MAPPING = {
    'ethereum': 'ETH',
    'binance-smart-chain': 'BSC',
    'polygon': 'MATIC',
    'fantom': 'FTM',
    'avalanche': 'AVAX'
}

const DEFAULT_CRYPTO = {
    'ethereum': 'ETH',
    'binance-smart-chain': 'BNB',
    'polygon': 'MATIC',
    'fantom': 'FTM',
    'avalanche': 'AVAX'

}

const NATIVE_ADDRESS = '0x'+'0'.repeat(40)

const useGuardarian = function({ relayerURL, selectedNetwork, initMode, tokens, walletAddress, selectedAsset }) {
    const FIAT_CURRENCIES_URL = `${relayerURL}/guardarian/currencies/fiat`
    const CRYPTO_CURRENCIES_URL = `${relayerURL}/guardarian/currencies/crypto`
    const offRampFiats = OFF_RAMP_FIAT
    const { addToast } = useToasts()
    const [network, setNetwork] = useState(selectedNetwork)
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [mode, setMode] = useState(initMode)
    const [amount, setAmount] = useState('50')

    const [cryptoCurrencies, setCryptoCurrencies] = useState({data: []})
    const [onRampFiats, setOnRampFiats] = useState({data: []})

    const [marketInfo, setMarketInfo] = useState(null)
    const [estimateInfo, setEstimateInfo] = useState({data: null, isLoading: false})

    const cryptoList = useMemo(() => {
        if (mode === 'buy') {
            return {
                data: cryptoCurrencies?.data?.filter(t => t.networks.find(n => n.network === NETWORK_MAPPING[network] && n.payment_methods.some(pm => pm.withdrawal_enabled
                ))).map(t => ({
                    label: t.ticker,
                    value: t.ticker ,
                    icon: t.logo_url
                })).filter(t => t.value) || [],
                isLoading: cryptoCurrencies?.isLoading
            }
        } else if (mode === 'sell') {
            return {
                data: cryptoCurrencies?.data?.filter(t => t.networks.find(n => n.network === NETWORK_MAPPING[network] && n.payment_methods.some(pm => pm.deposit_enabled) && tokens.find(bt => bt?.address?.toLowerCase() === n?.token_contract?.toLowerCase() || (bt?.address === NATIVE_ADDRESS && n?.token_contract === null))))
                    .map(t => ({
                        label: t.ticker,
                        value: t.ticker ,
                        icon: t.logo_url,
                        address: t.networks.find(n => n.network === NETWORK_MAPPING[network] && tokens.find(bt => bt?.address?.toLowerCase() === n?.token_contract?.toLowerCase() || (bt?.address === NATIVE_ADDRESS && n?.token_contract === null)))?.token_contract         
                    })).filter(t => t.value) || [],
                isLoading: cryptoCurrencies.isLoading
            }
        }
    }, [mode, cryptoCurrencies, network, tokens])

    const fiatList = useMemo(() => {
        if (mode === 'buy') {
            return {
                data: onRampFiats?.data?.map(f => ({
                    label: f.ticker,
                    value: f.ticker,
                    icon: f.logo_url || `https://changenow.io/images/sprite/currencies/${f?.ticker?.toLowerCase()}.svg`
                })) || [],
                isLoading: onRampFiats?.isLoading
            }
        } else if (mode === 'sell') {
            return {
                data: offRampFiats,
                isLoading: false
            }
        }
    }, [mode, onRampFiats, offRampFiats])

    //mode
    useEffect(()=> {
        if (mode === 'buy') {
            setAmount('50')
            setFrom(fiatList.data && fiatList.data[0] ? fiatList.data[0].value : null)
            setTo(DEFAULT_CRYPTO[network])
        } else if (mode === 'sell') {
            setAmount('')
            if (cryptoList.data && selectedAsset) {
                const isSelectedAssetExistInCryptoList = cryptoList.data && cryptoList.data.length && cryptoList.data.find(i => i.value === selectedAsset.symbol)
                if (isSelectedAssetExistInCryptoList) setFrom(isSelectedAssetExistInCryptoList.value)
            } else setFrom(cryptoList.data && cryptoList.data[0] ? cryptoList.data[0].value : null)
            setTo(fiatList.data && fiatList.data[0] ? fiatList.data[0].value : null)
        }
    }, [mode, fiatList, cryptoList, network, selectedAsset])

    //fiat
    useEffect(() => {
        setOnRampFiats({data: null, isLoading: true})
        fetchGet(FIAT_CURRENCIES_URL)
            .then((data) => setOnRampFiats({data, isLoading: false, error: {}, message: ''}))
            .catch(error => {
                setOnRampFiats({data: null, isLoading: false, error, message: 'Error while fetching fiat list'})
                addToast('Error while fetching fiat list', { error: true })
            })
    }, [FIAT_CURRENCIES_URL, addToast])

    //ctypto
    useEffect(() => {
        setCryptoCurrencies({data: null, isLoading: true})
        fetchGet(CRYPTO_CURRENCIES_URL)
            .then((data) => {
                setCryptoCurrencies({data, isLoading: false, error: {}, message: ''})
            })
            .catch(error => {
                setCryptoCurrencies({data: null, isLoading: false, error, message: 'Error while fetching crypto list'})
                addToast('Error while fetching crypto list', { error: true })
            })
    }, [network, CRYPTO_CURRENCIES_URL, addToast])


    const genMarketInfoUrl = useCallback(() => {
        const fromTo =
            mode === 'buy'
                ? `${from}_${to}-${NETWORK_MAPPING[network]}`
                : mode === 'sell'
                    ? `${from}-${NETWORK_MAPPING[network]}_${to}`
                    : null

        if (fromTo) return `${relayerURL}/guardarian/market-info/${fromTo}`
        else return null
    }, [mode, from, to, network, relayerURL])

    // MarketInfo
    useEffect(() => {
        if (!network || !from || !to || !mode) return setMarketInfo({ data: null, isLoading: false })

        setMarketInfo({ data: null, isLoading: true })

        const url = genMarketInfoUrl()

        // Prevent State updates on unmounted components
        let unmounted = false

        fetchGet(url)
            .then(({data}) => !unmounted && setMarketInfo({ data, isLoading: false }))
            .catch(error => !unmounted && (
                setMarketInfo({ data: null, isLoading: false, error, message: 'Error while fetching market info' }),
                addToast('Error while fetching market info', { error: true })
                ))
        return () => {
            unmounted = true
        }
    }, [network, mode, from, to, addToast, genMarketInfoUrl])


    const genEstimateUrl = useCallback(() => {
        if (mode === 'buy'){
            return `${relayerURL}/guardarian/estimate/${from}/${network}/${amount}/${to}/${'true'}`
        } else {
            return `${relayerURL}/guardarian/estimate/${from}/${network}/${amount}/${to}/${'false'}`
        }
    }, [mode, relayerURL, from, network, amount, to])

    // Estimate
    useEffect(() => {
        if (!network || !from || !to || !mode || !amount) return setEstimateInfo({ data: null, isLoading: false })

        setEstimateInfo({ data: null, isLoading: true })

        const url = genEstimateUrl()

        // Prevent State updates on unmounted components
        let unloaded = false

        fetchGet(url)
            .then(({data}) => !unloaded && setEstimateInfo({ data, isLoading: false }))
            .catch(error => !unloaded && (
                setEstimateInfo({ data: null, isLoading: false, error, message: 'Error while fetching estimate info' }),
                addToast('Error while fetching estimate info', { error: true }))
            )
        return () => {
            unloaded = true
        }
    }, [network, mode, from, to, amount, addToast, genEstimateUrl])

    function genTxnUrl () {
        if (mode === 'buy') {
            return `${relayerURL}/guardarian/transaction/${from}/null/${amount}/${to}/${selectedNetwork}/${walletAddress}`
        } else {
            return `${relayerURL}/guardarian/transaction/${from}/${selectedNetwork}/${amount}/${to}/null/null`
        }
    }

    return {
        marketInfo,
        estimateInfo,
        cryptoList,
        fiatList,
        network,
        from,
        to,
        mode,
        amount,
        cryptoCurrencies,
        setNetwork,
        setFrom,
        setTo,
        setMode,
        setAmount,
        genTxnUrl,
        NETWORK_MAPPING,
        NATIVE_ADDRESS,
        DEFAULT_CRYPTO
    }
    
}


export default useGuardarian