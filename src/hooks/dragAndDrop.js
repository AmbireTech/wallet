import { useRef } from 'react'

const useDragAndDrop = (sortingKey, onDropEnd) => {
  const dragItem = useRef()
  const dragOverItem = useRef()
  const target = useRef()
  const handle = useRef()

  const dragStart = (e, position) => (dragItem.current = position)

  const dragTarget = (e, position) => {
    handle.current = document.getElementById(`${position}-handle`)
    target.current = e.target
  }

  const dragEnter = (e, position) => (dragOverItem.current = position)

  const drop = (sortedList) => {
    const copyListItems = [...sortedList]
    const dragItemContent = copyListItems[dragItem.current]

    copyListItems.splice(dragItem.current, 1)
    copyListItems.splice(dragOverItem.current, 0, dragItemContent)

    dragItem.current = null
    dragOverItem.current = null

    const list = copyListItems.map((item) => item[sortingKey])

    onDropEnd(list)
  }

  return {
    dragStart,
    dragEnter,
    dragTarget,
    drop,
    target,
    handle
  }
}

export default useDragAndDrop
