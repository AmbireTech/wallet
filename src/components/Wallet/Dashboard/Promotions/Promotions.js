import { useCallback } from 'react'

import useLocalStorage from "hooks/useLocalStorage"
import PromoBanner from './PromoBanner/PromoBanner'

import styles from './Promotions.module.scss'

export default function Promotions({ rewardsData: { rewards: { promo }} }) {
    const [closedPromos, setClosedPromos] = useLocalStorage({ key: 'closedPromos', defaultValue: [] })

    const togglePromo = useCallback(promoId => {
        const prevClosed = [...closedPromos]
        const index = prevClosed.indexOf(promoId)

        if (index > -1) {
            prevClosed.splice(index, 1)
        } else {
            prevClosed.push(promoId)
        }

        setClosedPromos(prevClosed)
    }, [closedPromos, setClosedPromos])

    if (!promo) return null

    return (<div className={styles.wrapper}>
        <PromoBanner data={promo} togglePromo={togglePromo} minimized={closedPromos.includes(promo.id)} />
    </div>
    )
}