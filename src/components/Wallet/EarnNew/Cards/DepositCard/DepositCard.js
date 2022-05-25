import { useEffect, useRef, useState } from 'react'
import Card from 'components/Wallet/EarnNew/Card/Card'


const DepositCard = ({ networkId }) => {
    const currentNetwork = useRef()
    const [isLoading, setLoading] = useState(true)

    useEffect(() => {
        currentNetwork.current = networkId
        setLoading(true)
    }, [networkId])

    useEffect(() =>  setLoading(false), [])

    return (
        <Card
            loading={isLoading}
            large={false}
        />
    )
}

export default DepositCard
