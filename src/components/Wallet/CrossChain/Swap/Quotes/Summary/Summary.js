import { MdOutlineArrowForward } from "react-icons/md"

import styles from './Summary.module.scss'

const Summary = ({
  fromNetwork,
  fromAsset,
  toNetwork,
  toAsset
}) => (
  <div className={styles.wrapper}>
    <div className={styles.path}>
      <div className={styles.network}>
        <div className={styles.icon} style={{ backgroundImage: `url(${fromNetwork.icon})` }}></div>
        <div className={styles.name}>{fromNetwork.name}</div>
      </div>
      <div className={styles.token}>
        <div className={styles.icon} style={{ backgroundImage: `url(${fromAsset.icon})` }}></div>
        <div className={styles.name}>{fromAsset.label}</div>
      </div>
    </div>
    <MdOutlineArrowForward />
    <div className={styles.path}>
      <div className={styles.network}>
        <div className={styles.icon} style={{ backgroundImage: `url(${toNetwork.icon})` }}></div>
        <div className={styles.name}>{toNetwork.name}</div>
      </div>
      <div className={styles.token}>
        <div className={styles.icon} style={{ backgroundImage: `url(${toAsset.icon})` }}></div>
        <div className={styles.name}>
          {toAsset.name} ({toAsset.symbol})
        </div>
      </div>
    </div>
  </div>
)

export default Summary
