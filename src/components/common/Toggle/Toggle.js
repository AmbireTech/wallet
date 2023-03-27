import styles from './Toggle.module.scss'

const Toggle = ({ defaultChecked, checked, onChange }) => {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.slider} />
    </label>
  )
}

export default Toggle
