import './Promotions.scss'
import {
    // useEffect,
    useState
} from 'react'
import { useRelayerData } from 'hooks'

function getPromotion({ period, text, title, resources = {} } = {}) {

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
            {split.map(x => links[x] || x)}
        </div>
    )
}

export default function Promotions({ relayerURL }) {

    const [cacheBreak, _setCacheBreak] = useState(() => Date.now())

    const url = relayerURL
        ? `${relayerURL}/promotions?cacheBreak=${cacheBreak}`
        : null

    const { data, errMsg, isLoading } = useRelayerData(url)

    if (!data || errMsg || isLoading) return null
    return (
        <div>
            {getPromotion(data?.promo)}
        </div>
    )
}