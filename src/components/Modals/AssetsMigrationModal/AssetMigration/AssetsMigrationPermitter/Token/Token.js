import { ethers } from 'ethers'
import BigNumber from 'bignumber.js'

import { Button, Image } from 'components/common'

import { FaCheck, FaHourglass } from 'react-icons/fa'
import { GiToken } from 'react-icons/gi'

import styles from './Token.module.scss'

const Token = ({ data, sendToken, isSendDisabled }) => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <Image
          src={data.icon}
          alt="Token Icon"
          imageClassName={styles.icon}
          fallback={<GiToken className={styles.icon} />}
        />
      </div>
      <p className={styles.name}>{data.name}</p>
      <p className={styles.amount}>
        {new BigNumber(data.amount).div(10 ** data.decimals).toFixed()}{' '}
        <span className={styles.amountUsd}>(${(data.amount * data.rate).toFixed(2)})</span>
      </p>
      <div className={styles.status}>
        {!(
          (data.allowance && ethers.BigNumber.from(data.allowance).gte(data.amount)) ||
          data.sent
        ) ? (
          <>
            {data.pending || data.signing ? (
              <div className={styles.warning}>
                <FaHourglass /> Sending...
              </div>
            ) : (
              <Button
                small
                primaryGradient
                onClick={() => sendToken(data.address)}
                disabled={isSendDisabled}
              >
                Send
              </Button>
            )}
          </>
        ) : (
          <div className={styles.success} onClick={() => sendToken(data.address)}>
            <FaCheck /> Sent
          </div>
        )}
      </div>
    </div>
  )
}

export default Token
