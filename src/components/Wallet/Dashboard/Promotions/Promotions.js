import './Promotions.scss'
import {
    useEffect,
    useState
} from 'react'
import FinalCountdown from 'components/common/FinalCountdown/FinalCountdown'

function Promo({
    period,
    text,
    title,
    resources = {}
} = {}) {

    if (!text) return null

    const pattern = new RegExp(/\${{(\w+)}}/, 'gi')
    const split = text.split(pattern)

    const links = Object.entries(resources).reduce((anchors, [key, { label, href } = {}]) => {
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

    return (
        <div className="notice">
            {title &&
                <div className='title'>
                    {title}
                </div>
            }
            <div>
                {split.map(x => links[x] || x)}
            </div>
            {
                period?.to && period?.timer &&
                <div className='timer'>
                    <FinalCountdown endDateTime={period.to} />
                </div>
            }
        </div>
    )
}

export default function Promotions({ rewardsData }) {
    const [promo, setPromo] = useState(null)

    useEffect(() => {
        if (!promo && !!rewardsData?.data?.promo) {
            setPromo(rewardsData?.data?.promo)
        }
    }, [promo, rewardsData?.data?.promo])

    if (!promo) return null
    return (
        <Promo {...promo} />
    )
}