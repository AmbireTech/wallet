import { useEffect, useState } from 'react'
import { useModals } from '../../../hooks'
import { Modal, Button } from '../../common'
import { HiOutlineExternalLink } from 'react-icons/hi'

const SelectSignerAccountModal = ({signersToChoose, onSignerAddressClicked, selectedNetwork }) => {
  const { hideModal } = useModals()
  const [currentPage, setCurrentPage] = useState(0)
  
  const paginate = (arr, size) => {
    return arr.reduce((acc, val, i) => {
      let idx = Math.floor(i / size)
      let page = acc[idx] || (acc[idx] = [])
      page.push(val)

      return acc
    }, [])
  }

  let pages = []
  let pageSize = 5

  pages = paginate(signersToChoose, pageSize)

  const nextPage = () => {
    if (currentPage === pages.length - 1) return
    setCurrentPage(prevState => prevState + 1)
  }

  const prevPage = () => {
    if (currentPage === 0) return
    setCurrentPage(prevState => prevState - 1)
  }

  const formatAddress = addr => {
    return addr.slice(0, 4) + '...' + addr.slice(addr.length - 4, addr.length)
  }

  return (
    <Modal id="select-signer-modal" title="Select a signer account">
      <div
        className="loginSignupWrapper chooseSigners"
        style={{ background: 'transparent' }}
      >
        <ul
          id="signersToChoose"
          style={{ height: '275px', width: '550px', padding: '0' }}
        >
          {signersToChoose
            ? pages[currentPage].map((addr, index) => (
                <li key={addr}>
                  {currentPage * pageSize + index + 1}&nbsp;
                  <span
                    onClick={() =>
                      onSignerAddressClicked({
                        address: addr,
                        index: index,
                      })
                    }
                  >
                    {formatAddress(addr)}
                  </span>
                  <a
                    href={
                      selectedNetwork.explorerUrl + '/address/' + addr
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    <HiOutlineExternalLink size={20} />
                  </a>
                </li>
              ))
            : null}
        </ul>
        <div>
          {currentPage + 1}/{pages.length}
        </div>
        <div className="modal-btns-wrapper">
          <Button small type="button" onClick={prevPage}>
            Prev
          </Button>
          <Button small type="button" onClick={nextPage}>
            Next
          </Button>
          <Button clear small onClick={hideModal}>Ignore</Button>
        </div>
      </div>
    </Modal>
  )
}

export default SelectSignerAccountModal
