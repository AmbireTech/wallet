import './SelectSignerAccountModal.scss'

import { useState } from 'react'
import { useModals } from '../../../hooks'
import { Modal, Button } from '../../common'
import { HiOutlineExternalLink } from 'react-icons/hi'

const SelectSignerAccountModal = ({
  signersToChoose,
  onSignerAddressClicked,
  selectedNetwork,
}) => {
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
    return addr.slice(0, 5) + '...' + addr.slice(addr.length - 5, addr.length)
  }

  const onAddressClicked = (addr, index) => {
    onSignerAddressClicked({
      address: addr,
      index: index,
    })

    hideModal()
  }

  return (
    <Modal id="select-signer-modal" title="Select a signer account">
      <div className="intro">
        Signer account is the Trezor/Ledger/Web3 account you will use to sign
        transactions with on Ambire Wallet.
      </div>
      <div className="loginSignupWrapper chooseSigners">
        <ul id="signersToChoose">
          {signersToChoose
            ? pages[currentPage].map((addr, index) => (
                <li
                  key={addr}
                  className={!(index % 2) && ' odd-rows-bg'}
                >
                  <span className="index-row">
                    {currentPage * pageSize + index + 1}
                  </span>
                  <span
                    onClick={() =>
                      onAddressClicked(addr, currentPage * pageSize + index)
                    }
                  >
                    {formatAddress(addr)}
                  </span>
                  <a
                    href={selectedNetwork.explorerUrl + '/address/' + addr}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <HiOutlineExternalLink size={25} />
                  </a>
                </li>
              ))
            : null}
        </ul>
        <div className="pages">
          {currentPage + 1}/{pages.length}
        </div>
        <div className="buttons">
          <Button clear small type="button" onClick={prevPage}>
            Prev
          </Button>
          <Button small type="button" onClick={nextPage}>
            Next
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default SelectSignerAccountModal
