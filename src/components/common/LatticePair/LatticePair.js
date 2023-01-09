import Lattice from './Lattice'
import useLattice from 'hooks/useLattice'

const LatticePair = ({ addresses, title }) => {
    const latticeProps = useLattice({ addresses })

    return <Lattice {...latticeProps} title={title}  />
}

export default LatticePair
