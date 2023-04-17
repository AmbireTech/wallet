import cn from 'classnames'

import { Button, Loading } from 'components/common'

import { MdInfo, MdOutlineClose, MdWarning } from 'react-icons/md'

import styles from './Replace.module.scss'

const Replace = ({
  isInt,
  mustReplaceNonce,
  canProceed,
  rejectTxn
}) => {
  // NOTE there's a case in which both "This transaction will replace the current pending transaction" and the checkbox will render - when we're doing a modify
  // If we are replacing a txn, look at whether canProceed is true
  return isInt(mustReplaceNonce) && (
      <>
        {
          // We always warn the user if they're trying to replace a particular transaction
          // This doesn't need to show when replacing is optional
          (canProceed || canProceed === null) && (
            <div className={cn(styles.replaceInfo, styles.warning)}>
              <MdWarning />
              <span>
                This transaction bundle will replace the one that's
                currently pending.
              </span>
            </div>
          )
        }
  
        {
          // canProceed equals null means we don't have data yet
          canProceed === null && (
            <div>
              <Loading />
            </div>
          )
        }
  
        {canProceed === false && (
          <div className={styles.wrapper}>
            <div className={cn(styles.replaceInfo, styles.info)}>
              <MdInfo />
              <span>
                The transaction you're trying to replace has already been
                confirmed
              </span>
            </div>
            <div className={styles.buttons}>
              <Button
                variant="secondary"
                startIcon={<MdOutlineClose />}
                type="button"
                className={styles.button}
                onClick={rejectTxn}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </>
  )
}

export default Replace