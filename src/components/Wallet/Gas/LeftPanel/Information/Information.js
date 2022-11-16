import styles from './Information.module.scss'

const Information = () => (
  <div>
    <p className={styles.benefit}>Save over 20% of fees by enabling the gas tank</p>
    <p>This is your special account for pre-paying transaction fees.</p>
    <p>By filling up your Gas Tank, you are setting aside, or prepaying for network fees.</p>
    <p>
      Only the tokens listed below are eligible for filling up your Gas Tank. You can add more tokens to your Gas Tank
      at any time.
    </p>
    <p>The tokens in your Gas Tank can pay network fees on all supported networks.</p>
  </div>
)

export default Information
