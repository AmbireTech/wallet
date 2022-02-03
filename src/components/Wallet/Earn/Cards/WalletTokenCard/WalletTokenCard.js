import { useState, useCallback } from "react"
import Card from 'components/Wallet/Earn/Card/Card'

import AMBIRE_ICON from 'resources/logo.png'
import { useEffect } from "react"
import { MdInfo } from "react-icons/md"
import { ToolTip } from "components/common"

const WALLET_TOKEN_ADDRESS = '0x88800092ff476844f74dc2fc427974bbee2794ae'

const WalletTokenCard = ({ networkId, accountId, tokens, walletTokenInfoData, addRequest }) => {
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState([])

    const unavailable = networkId !== 'ethereum'
    const walletTokenAPY = !walletTokenInfoData.isLoading && walletTokenInfoData.data ? (walletTokenInfoData.data?.apy).toFixed(2) : 0

    const tokensItems = tokens
        .filter(({ address }) => address === WALLET_TOKEN_ADDRESS)
        .map(({ address, symbol, tokenImageUrl, balance, balanceRaw }) => ({
            type: 'deposit',
            icon: tokenImageUrl,
            label: symbol,
            value: address,
            symbol,
            balance,
            balanceRaw
        }))

    const onTokenSelect = useCallback(() => {
        setDetails([
            [
                <>
                    Annual Percentage Yield (APY)
                    <ToolTip label="IN ADDITION to what you earn in $WALLETs">
                        <MdInfo/>
                    </ToolTip>
                </>,
                `${walletTokenAPY}%`
            ],
            ['Lock', 'No Lock'],
            ['Type', 'Variable Rate'],
        ])
    }, [])

    const onValidate = () => {

    }

    useEffect(() => setLoading(false), [])

    return (
        <Card
            loading={loading}
            icon={AMBIRE_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={details}
            onTokenSelect={onTokenSelect}
            onValidate={onValidate}
        />
    )
}

export default WalletTokenCard