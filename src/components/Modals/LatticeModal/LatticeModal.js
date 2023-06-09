import { Modal } from 'components/common'

import LatticePair from 'components/common/LatticePair/LatticePair'
import styles from './LatticeModal.module.scss'

const LatticeModal = ({ addresses }) => {
  return (
    <Modal className={styles.wrapper} title="Connect to Lattice Device">
      <LatticePair addresses={addresses} />
    </Modal>
  )
}

export default LatticeModal
