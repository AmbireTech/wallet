import './Modal.scss'

const Modal = props => {
  return (
    <div
      className="modal"
      style={{
        transform: props.show ? 'translateY(0)' : 'translateY(-100vh)',
        opacity: props.show ? 1 : 0,
      }}
    >
      {props.children}
      <button type="button" onClick={props.modalClosed}>CLOSE</button>
    </div>
  )
}

export default Modal
