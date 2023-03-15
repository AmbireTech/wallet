import React from 'react'
import { RiWifiOffLine } from 'react-icons/ri'

import styles from './OfflineView.module.scss'

export default function OfflineView() {
    return (
        <div className={styles.wrapper}>
            <RiWifiOffLine/>
            <div className={styles.text}>You are currently offline.</div>
        </div>
    )
}