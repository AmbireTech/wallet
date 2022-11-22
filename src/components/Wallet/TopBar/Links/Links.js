import './Links.scss'

import { DropDown } from "components/common"
import { MdChatBubbleOutline, MdMenuBook, MdOutlineHelpOutline, MdOutlineLightbulb } from "react-icons/md";
import { BsDiscord, BsTelegram, BsTwitter } from "react-icons/bs";
import useLocalStorage from "hooks/useLocalStorage";

const Links = () => {
    const [linksViewed, setLinksViewed] = useLocalStorage({ key: 'linksViewed', defaultValue: false })

    const onOpen = () => {
        setLinksViewed(true)
    }

    return (
        <DropDown id="help-dropdown" className={`${linksViewed ? 'viewed' : ''}`} title={<MdOutlineHelpOutline/>} onOpen={onOpen}>
            <a className="item" href='https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet' target="_blank" rel="noreferrer">
                <MdMenuBook/> Help Center
            </a>
            <a className="item" href="https://help.ambire.com/hc/en-us/requests/new" target="_blank" rel="noreferrer">
                <MdChatBubbleOutline/> Report an issue
            </a>
            <a className="item" href="https://discord.gg/nMBGJsb" target="_blank" rel="noreferrer">
                <BsDiscord/> Discord
            </a>
            <a className="item" href="https://twitter.com/AmbireWallet" target="_blank" rel="noreferrer">
                <BsTwitter/> Twitter
            </a>
            <a className="item" href="https://t.me/AmbireOfficial" target="_blank" rel="noreferrer">
                <BsTelegram/> Telegram
            </a>
            <a className="item" href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf" target="_blank" rel="noreferrer">
                <MdOutlineLightbulb/> ToS
            </a>
        </DropDown>
    )
}

export default Links
