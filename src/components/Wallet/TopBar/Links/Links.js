import React from 'react'
import styles from './Links.module.scss'

import { DropDown } from "components/common"
import { ReactComponent as HelpCenter } from './images/help-center.svg'
import { ReactComponent as Issue } from './images/issue.svg'
import { ReactComponent as Discord } from './images/discord.svg'
import { ReactComponent as Twitter } from './images/twitter.svg'
import { ReactComponent as Telegram } from './images/telegram.svg'
import { ReactComponent as Tos } from './images/tos.svg'
import useLocalStorage from "hooks/useLocalStorage";
import DropDownItem from 'components/common/DropDown/DropDownItem/DropDownItem';

import { ReactComponent as QuestionMark } from 'resources/icons/question-mark.svg'

const Links = () => {
    const [linksViewed, setLinksViewed] = useLocalStorage({ key: 'linksViewed', defaultValue: false })

    const onOpen = () => setLinksViewed(true)

    return (
        <DropDown className={`${styles.wrapper} ${linksViewed ? styles.viewed : ''}`} title={<QuestionMark />} onOpen={onOpen}>
            <DropDownItem className={styles.item}>
                <a href='https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet' target="_blank" rel="noreferrer">
                    <HelpCenter /> Help Center
                </a>
            </DropDownItem>
            <DropDownItem className={styles.item}>
                <a href="https://help.ambire.com/hc/en-us/requests/new" target="_blank" rel="noreferrer">
                    <Issue /> Report an issue
                </a>
            </DropDownItem>
            <DropDownItem className={styles.item}>
                <a href="https://discord.gg/nMBGJsb" target="_blank" rel="noreferrer">
                    <Discord /> Discord
                </a>
            </DropDownItem>
            <DropDownItem className={styles.item}>
                <a href="https://twitter.com/AmbireWallet" target="_blank" rel="noreferrer">
                    <Twitter /> Twitter
                </a>
            </DropDownItem>
            <DropDownItem className={styles.item}>
                <a href="https://t.me/AmbireOfficial" target="_blank" rel="noreferrer">
                    <Telegram /> Telegram
                </a>
            </DropDownItem>
            <DropDownItem className={styles.item}>
                <a href="https://www.ambire.com/Ambire%20ToS%20and%20PP%20(26%20November%202021).pdf" target="_blank" rel="noreferrer">
                    <Tos /> ToS
                </a>
            </DropDownItem>
        </DropDown>
    )
}

export default React.memo(Links)
