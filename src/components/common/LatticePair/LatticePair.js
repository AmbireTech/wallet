import Lattice from './Lattice'
import useLattice from 'hooks/useLattice'

const LatticePair = ({ addresses }) => {
    const latticeProps = useLattice({ addresses })

    return <Lattice title="Connect to Lattice Device" {...latticeProps}  />
}

export default LatticePair
