import useLattice from 'hooks/useLattice'
import Lattice from './Lattice'

const LatticePair = ({ addresses, title }) => {
  const latticeProps = useLattice({ addresses })

  return <Lattice {...latticeProps} title={title} />
}

export default LatticePair
