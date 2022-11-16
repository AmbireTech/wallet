import { formatUnits } from 'ethers/lib/utils'

import { getTokenIcon } from 'lib/icons'

import { GiGasPump } from 'react-icons/gi'
import { HiOutlineExternalLink } from 'react-icons/hi'

const toLocaleDateTime = (date) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

const History = ({ network, gasTankFilledTxns, feeAssetsRes }) => {
  return (
    <div>
      <span className="title">Gas Tank top ups history on {network.id.toUpperCase()}</span>
      <p className="warning-msg">
        Warning: It will take some time to top up the Gas Tank after the transaction is signed.
      </p>
      <div className="txns-wrapper">
        {gasTankFilledTxns && gasTankFilledTxns.length ? (
          gasTankFilledTxns
            .map((item, key) => {
              const tokenDetails =
                feeAssetsRes && feeAssetsRes.length
                  ? feeAssetsRes.find(
                      ({ address, network }) =>
                        address.toLowerCase() === item.address.toLowerCase() && network === item.network
                    )
                  : null
              if (!tokenDetails) return null // txn to gas Tank with not eligible token
              return (
                <div key={key} className="txns-item-wrapper">
                  <div className="logo">
                    <GiGasPump size={20} />
                  </div>
                  <div className="date">
                    {item.submittedAt && toLocaleDateTime(new Date(item.submittedAt)).toString()}
                  </div>
                  <div className="balance">
                    {tokenDetails && (
                      <>
                        <img
                          width="25px"
                          height="25px"
                          alt="logo"
                          src={tokenDetails.icon || getTokenIcon(item.network, item.address)}
                        />
                        <div>{tokenDetails.symbol.toUpperCase()}</div>
                        {tokenDetails && formatUnits(item.value.toString(), tokenDetails.decimals).toString()}
                      </>
                    )}
                  </div>
                  <div className="logo">
                    <a
                      href={network.explorerUrl + '/tx/' + item.txId}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HiOutlineExternalLink size={20} />
                    </a>
                  </div>
                </div>
              )
            })
            .filter((r) => r)
        ) : (
          <p>No top ups were made to Gas Tank on {network.id.toUpperCase()}</p>
        )}
      </div>
    </div>
  )
}

export default History
