import styles from './Footer.module.scss'

const Footer = ({ serviceTime, maxServiceTime, fee, feeSymbol }) => (
  <div className={styles.wrapper}>
    <p className={styles.fee}>
      Fee: {(fee < 1 ? fee.toFixed(6) : fee.toFixed(4)).replace(/0+$/, '')} {feeSymbol}
    </p>
    <p className={styles.time}>
      ETA {serviceTime / 60} minutes, MAX ETA {maxServiceTime / 60} minutes
    </p>
  </div>
)

export default Footer
