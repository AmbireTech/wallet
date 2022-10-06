import styles from  './Panel.module.scss'
import cn from 'classnames'

const Panel = ({ title, children, className, titleClassName }) => {
    return <div className={cn(styles.wrapper, className || '')}>
        {title && <div className={cn(styles.title, titleClassName || '')}>{ title }</div>}
        <div className={styles.content}>{ children }</div>
    </div>
}

export default Panel
