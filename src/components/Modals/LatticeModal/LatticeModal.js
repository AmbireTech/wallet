import styles from './LatticeModal.module.scss'

import { Modal } from 'components/common'

import Lattice from 'components/common/LatticePair/Lattice'
import useLattice from 'hooks/useLattice'

const LatticeModal = ({ addresses }) => {
    const { buttons, ...latticeProps } = useLattice({ addresses })

    return (
        <Modal className={styles.wrapper} title="Connect to Lattice Device" buttons={buttons}>
            <Lattice {...latticeProps} />
        </Modal>
    )
}

export default LatticeModal
