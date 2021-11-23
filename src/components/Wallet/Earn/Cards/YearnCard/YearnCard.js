import Card from '../Card/Card'

import YEARN_ICON from '../../../../../resources/yearn.svg'
import networks from '../../../../../consts/networks'
import { getDefaultTokensItems } from './defaultTokens'

const YearnCard = ({ networkId }) => {
    const unavailable = networkId !== 'ethereum'
    const tokensItems = getDefaultTokensItems(networkId).map(token => ({
        ...token,
        icon: token.img,
        label: token.symbol,
        value: token.address
    }))
    console.log(tokensItems);

    return (
        <Card
            icon={YEARN_ICON}
            unavailable={unavailable}
            tokensItems={tokensItems}
            details={[]}
            onTokenSelect={() => {}}
        />
    )
}

export default YearnCard