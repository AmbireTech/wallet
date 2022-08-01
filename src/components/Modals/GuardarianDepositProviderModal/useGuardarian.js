import { useState, useEffect, useRef } from 'react'
import { fetchGet } from 'lib/fetch';

const RESET_DATA_AFTER = 10000
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

const useGuardarian = function({relayerURL, selectedNetwork, initMode, tokens, walletAddress}) {

    const FIAT_CURRENCIES_URL = `${relayerURL}/guardarian/currencies/fiat`
    const CRYPTO_CURRENCIES_URL = `${relayerURL}/guardarian/currencies/crypto`
    
    const offRampFiats = OFF_RAMP_FIAT

    const [network, setNetwork] = useState(selectedNetwork)
    const [from, setFrom] = useState(null)
    const [to, setTo] = useState(null)
    const [mode, setMode] = useState(initMode)
    const [amount, setAmount] = useState('50')
   
    const [fiatList, setFiatList] = useState({data: []})
    const [cryptoList, setCryptoList] = useState({data: []})

    const [cryptoCurrencies, setCryptoCurrencies] = useState({data: []})
    const [onRampFiats, setOnRampFiats] = useState({data: []})

    const [marketInfo, setMarketInfo] = useState(null)
    const [estimateInfo, setEstimateInfo] = useState({data: null, isLoading: false})

    const prevMarketInfoUrl = useRef('')
    const prevEstimateUrl = useRef('')


    function genMarketInfoUrl() {
        const fromTo = 
        mode === 'buy'
            ? `${from}_${to}-${NETWORK_MAPPING[network]}`
            : mode === 'sell'
                ? `${from}-${NETWORK_MAPPING[network]}_${to}`
                : null

        if (fromTo) return `${relayerURL}/guardarian/market-info/${fromTo}`
        else return null
    }


    function genEstimateUrl() {
        if (mode === 'buy'){
            return `${relayerURL}/guardarian/estimate/${from}/${network}/${amount}/${to}/${'true'}`
        } else {
            return `${relayerURL}/guardarian/estimate/${from}/${network}/${amount}/${to}/${'false'}`
        }
    }

    //mode
    useEffect(()=> {
        if (mode === 'buy') {
            setFiatList({
                data: onRampFiats?.data?.map(f => ({
                    label: f.ticker,
                    value: f.ticker,
                    icon: f.logo_url || `https://changenow.io/images/sprite/currencies/${f?.ticker?.toLowerCase()}.svg`
                })) || [],
                isLoading: onRampFiats?.isLoading
            })
            setCryptoList({
                data: cryptoCurrencies?.data?.filter(t => t.networks.find(n => n.network === NETWORK_MAPPING[network])).map(t => ({
                    label: t.ticker,
                    value: t.ticker ,
                    icon: t.logo_url
                })).filter(t => t.value) || [],
                isLoading: cryptoCurrencies?.isLoading
            })
            setAmount('50')
            setFrom(fiatList.data && fiatList.data[0] ? fiatList.data[0].value : null)
            setTo(cryptoList.data && cryptoList.data[0] ? cryptoList.data[0] : null)
        } else if (mode === 'sell') {
            setFiatList({
                data: offRampFiats,
                isLoading: false
            })
            setCryptoList({
                data: cryptoCurrencies?.data?.filter(t => t.networks.find(n => n.network === NETWORK_MAPPING[network] && tokens.find(bt => bt?.address?.toLowerCase() === n?.token_contract?.toLowerCase())))
                    .map(t => ({
                        label: t.ticker,
                        value: t.ticker ,
                        icon: t.logo_url
                    })).filter(t => t.value) || [],
                isLoading: cryptoCurrencies.isLoading
            })
            setAmount('1')
            setFrom(cryptoList.data && cryptoList.data[0] ? cryptoList.data[0] : null)
            setTo(fiatList.data && fiatList.data[0] ? fiatList.data[0].value : null)
        }
    }, [mode, cryptoCurrencies, onRampFiats])


    //fiat
    useEffect(() => {
        setOnRampFiats({data: null, isLoading: true})
        fetchGet(FIAT_CURRENCIES_URL)
            .then((data) => setOnRampFiats({data, isLoading: false}))
            .catch(error => setOnRampFiats({data: null, isLoading: false, error, message: 'Error while fetching fiat list'}))
    }, [network])
    

    //ctypto
    useEffect(() => {
        setCryptoCurrencies({data: null, isLoading: true})
        fetchGet(CRYPTO_CURRENCIES_URL)
            .then((data) => setCryptoCurrencies({data, isLoading: false}))
            .catch(error => setCryptoCurrencies({data: null, isLoading: false, error, message: 'Error while fetching crypto list'}))
    }, [network])


    //MarketInfo
    useEffect(() => {
        setMarketInfo({data: null, isLoading: true })
        if (!network || !from || !to || !mode) return setMarketInfo({data: null, isLoading: false})

        let resetDataTimer = null
        const url = genMarketInfoUrl()
        if (prevMarketInfoUrl.current !== url) {
            resetDataTimer = setTimeout(() => setMarketInfo({data: null, isLoading: false, error: true, message: 'timeout'}), RESET_DATA_AFTER)
        }
        prevMarketInfoUrl.current = url
        let unloaded = false

        fetchGet(url)
            .then(({data}) => !unloaded && prevMarketInfoUrl.current === url && setMarketInfo({data, isLoading: false}))
            .catch(error => !unloaded && setMarketInfo({data: null, isLoading: false, error, message: 'Error while fetching market info'}))
            .then(() => clearTimeout(resetDataTimer))
        return () => {
            unloaded = true
            clearTimeout(resetDataTimer)
        }
    }, [network, from ,to])
    

    //Estimate
    useEffect(() => {
        setEstimateInfo({data: null, isLoading: true })
        if (!network || !from || !to || !mode || !amount || amount==='') return setEstimateInfo({data: null, isLoading: false})

        let resetDataTimer = null
        const url = genEstimateUrl()
        if (prevEstimateUrl.current !== url) {
            resetDataTimer = setTimeout(() => setEstimateInfo({data: null, isLoading: false, error: true, message: 'timeout'}), RESET_DATA_AFTER)
        }
        prevEstimateUrl.current = url
        let unloaded = false

        fetchGet(url)
            .then(({data}) => !unloaded && prevEstimateUrl.current === url && setEstimateInfo({data, isLoading: false}))
            .catch(error => !unloaded && setEstimateInfo({data: null, isLoading: false, error, message: 'Error while fetching market info'}))
            .then(() => clearTimeout(resetDataTimer))
        return () => {
            unloaded = true
            clearTimeout(resetDataTimer)
        }
    }, [marketInfo, amount])


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
        genTxnUrl
    }
    
}


export default useGuardarian