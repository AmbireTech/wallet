import { Alert } from 'components/common'
import styles from './Information.module.scss'

const Information = () => (
  <div className={styles.wrapper}>
    <Alert
      title="Save over 20% of fees by enabling the Gas Tank"
      type="info"
      className={styles.saveAlert}
      size="small"
    />
    <p>The Ambire Gas Tank is your special account for pre-paying transaction fees.</p>
    <p>By filling up your Gas Tank, you are setting aside funds (or prepaying) for network fees.</p>
    <p>Only the tokens listed on this page are eligible for filling up your Gas Tank. You can add more tokens to your Gas Tank at any time.</p>
    <p>The tokens in your Gas Tank can pay network fees on all supported networks.</p>
  </div>
)

export default Information
