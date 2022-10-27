import styles from './Promotions.module.scss'
import { useCallback } from 'react'
import FinalCountdown from 'components/common/FinalCountdown/FinalCountdown'
import useLocalStorage from "hooks/useLocalStorage"
import { AiOutlineRight } from 'react-icons/ai'
import { MdOutlineMarkEmailUnread } from 'react-icons/md'

function Promo({
    id,
    period,
    text,
    title,
    resources = {},
    togglePromo,
    minimized
} = {}) {

    if (!text) return null

    const pattern = new RegExp(/\${{(\w+)}}/, 'gi')
    const split = text.split(pattern)
    const { emojies, color, background, ...linksRes } = resources

    const links = Object.entries(linksRes).reduce((anchors, [key, { label, href } = {}]) => {
        const anc =
            <a
                key={key}
                className="link"
                href={href}
                target="_blank"
                rel="noreferrer noopener">
                {label}
            </a>

        anchors[key] = anc
        return anchors
    }, {})

    const elmojies = Object.entries({ ...emojies }).reduce((elmos, [key, { text, size } = {}]) => {
        const elmo = <span key={key} className={styles.emoji} style={{ fontSize: size }}>
            {text}
        </span >

        elmos[key] = elmo
        return elmos
    }, {})

    return (
        <div className={`${styles.notice} ${minimized ? styles.minimized : ''}`} style={{
            ...(background ? { backgroundColor: background } : {}),
            ...(color ? { color } : {})
        }}>
            {!minimized && <div>
                {title &&
                    <div className={styles.title}>
                        {title}
                    </div>
                }
                <div>
                    {split.map(x => links[x] || elmojies[x] || x)}
                </div>
                {
                    period?.to && period?.timer &&
                    <div className={styles.timer}>
                        <FinalCountdown endDateTime={period.to} />
                    </div>
                }
            </div>
            }
            {
                !!id
                    ? minimized
                        ? <MdOutlineMarkEmailUnread className={styles.closeBtn} onClick={() => togglePromo(id)} />
                        : <div><AiOutlineRight className={styles.closeBtn} onClick={() => togglePromo(id)} /></div>
                    : null

            }
        </div>
    )
}

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

    return (
        <Promo {...promo} togglePromo={togglePromo} minimized={closedPromos.includes(promo.id)} />
    )
}