import styles from './AddOrHideTokenButton.module.scss'

const AddOrHideTokenButton = ({ openAddOrHideTokenModal }) => {

  return (
    <button className={styles.wrapper} onClick={openAddOrHideTokenModal}>
      Add or Hide Token
    </button>
  )
}

export default AddOrHideTokenButton