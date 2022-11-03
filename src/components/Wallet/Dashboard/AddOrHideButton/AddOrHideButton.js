import styles from './AddOrHideButton.module.scss'

const AddOrHideButton = ({ onClick, children }) => (
  <button className={styles.wrapper} onClick={onClick}>
    Add or Hide
    {' '}
    { children }
  </button>
)

export default AddOrHideButton