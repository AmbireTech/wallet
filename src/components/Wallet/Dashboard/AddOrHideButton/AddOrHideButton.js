import styles from './AddOrHideButton.module.scss'

const AddOrHideButton = ({ onClick, children }) => (
  <button className={styles.wrapper} onClick={onClick}>
    { children }
  </button>
)

export default AddOrHideButton