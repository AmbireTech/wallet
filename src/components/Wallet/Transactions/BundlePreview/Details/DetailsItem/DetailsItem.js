import styles from './DetailsItem.module.scss'

const DetailsItem = ({title, text}) => (
	<div className={styles.wrapper}>
		<h4 className={styles.itemTitle}>{title}</h4>
		<p className={styles.itemText}>{text}</p>
	</div>
)

export default DetailsItem