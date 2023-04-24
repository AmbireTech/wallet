import cn from 'classnames'
import './Loading.scss'

import { AiOutlineLoading } from 'react-icons/ai'

const Loading = ({ size = 35, className }) => {
  return (
    <div className={cn('loading', className)}>
      <div className="icon">
        <AiOutlineLoading size={size} />
      </div>
    </div>
  )
}

export default Loading
