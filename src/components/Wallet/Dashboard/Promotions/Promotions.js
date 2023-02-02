import { useCallback } from 'react'

import useLocalStorage from "hooks/useLocalStorage"

import PromoBanner from './PromoBanner/PromoBanner'

export default function Promotions({ rewardsData: { rewards: { promoD }} }) {
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

    // if (!promo) return null

    const promo = {
        id: '3f71faba',
        text: 'Special quiz is here. ${{link1}}',
        title: 'Quiz time!',
        icon: '👛',
        type: 'warning', // waring / error / success
        resources: {
            link1: {
                href: 'https://survey.typeform.com/to/YgEolshA#juba=${{identity}}',
                label: 'You are invited to our quiz.'
            }
        },
        period: { from: new Date('2023-02-01 0:0:0'), to: new Date('2023-02-10 23:59:59'), timer: true }
    }

    return (
        <PromoBanner data={promo} togglePromo={togglePromo} minimized={closedPromos.includes(promo.id)} />
    )
}