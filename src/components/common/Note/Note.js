import cn from 'classnames'

import { ReactComponent as NoteIcon } from 'resources/icons/note.svg'
import styles from './Note.module.scss'

const Note = ({ className, children }) => (
  <label className={cn(styles.wrapper, className)}>
    <NoteIcon /> <label>Note</label>
    <p>{children}</p>
  </label>
)

export default Note
