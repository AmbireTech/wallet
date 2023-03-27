import styles from './Toggle.module.scss'

const Toggle = ({ defaultChecked, checked, onChange, id }) => {
  return (
    <label htmlFor={id} className={styles.toggle}>
      <input
        type="checkbox"
        id={id}
        defaultChecked={defaultChecked}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.slider} />
    </label>
  )
}

export default Toggle
