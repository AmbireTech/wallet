import './Promotions.scss'
import {
    useEffect,
    useState,
    useCallback
} from 'react'
import FinalCountdown from 'components/common/FinalCountdown/FinalCountdown'
import useLocalStorage from "hooks/useLocalStorage"
import { MdOutlineClose } from 'react-icons/md'
import { ToolTip } from 'components/common'

function Promo({
    id,
    period,
    text,
    title,
    resources = {},
    closePromo
} = {}) {

    if (!text) return null

    const pattern = new RegExp(/\${{(\w+)}}/, 'gi')
    const split = text.split(pattern)
    const { emojies, color, background, ...linksRes } = resources

    const links = Object.entries(linksRes).reduce((anchors, [key, { label, href } = {}]) => {
        const anc =
            <a
                key={label}
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
        const elmo = <span style={{ fontSize: size }}>
            {text}
        </span >

        elmos[key] = elmo
        return elmos
    }, {})

    return (
        <div className="notice" style={{
            ...(background ? { backgroundColor: background } : {}),
            ...(color ? { color } : {})
        }}>
            <div>
                {title &&
                    <div className='title'>
                        {title}
                    </div>
                }
                <div>
                    {split.map(x => links[x] || elmojies[x] || x)}
                </div>
                {
                    period?.to && period?.timer &&
                    <div className='timer'>
                        <FinalCountdown endDateTime={period.to} />
                    </div>
                }
            </div>
            {
                !!id &&
                <ToolTip label="* Warning: Once closed you will not see this promo again!">
                    <MdOutlineClose className='close-btn' onClick={() => closePromo(id)} />
                </ToolTip>
            }
        </div>
    )
}

export default function Promotions({ rewardsData }) {
    const [promo, setPromo] = useState(null)
    const [closedPromos, setClosedPromos] = useLocalStorage({ key: 'closedPromos', defaultValue: [] })

    const closePromo = useCallback(promoId => {
        setClosedPromos(prevClosed => {
            const deduped = prevClosed.filter(x => x !== promoId)
            deduped.push(promoId)

            return prevClosed
        })
    }, [setClosedPromos])

    useEffect(() => {
        if (!promo && !!rewardsData?.data?.promo) {
            setPromo(rewardsData?.data?.promo)
        }
    }, [closedPromos, promo, rewardsData?.data?.promo])

    if (!promo || closedPromos.includes(promo?.id)) return null
    return (
        <Promo {...promo} closePromo={closePromo} />
    )
}