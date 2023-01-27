import styles from './Note.module.scss'
import cn from 'classnames'

import { ReactComponent as NoteIcon } from 'resources/icons/note.svg'

const Note = ({ className, children }) => (
    <label className={cn(styles.wrapper, className)}>
        <NoteIcon /> <label>Note</label>
        <p>{ children }</p>
    </label>
)

export default Note