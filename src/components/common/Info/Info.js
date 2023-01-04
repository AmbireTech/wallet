import styles from './Info.module.scss'
import cn from 'classnames'

import { ReactComponent as InfoIcon } from 'resources/icons/information.svg'

const Info = ({ className, children }) => (
    <label className={cn(styles.wrapper, className)}>
        <InfoIcon />
        <label>{ children }</label>
    </label>
)

export default Info