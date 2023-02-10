import styles from './DropDownItem.module.scss'

const DropDownItem = ({ className, children}) => (
  <div className={`${className} ${styles.item}`}>
    {children}
  </div>
)

export default DropDownItem