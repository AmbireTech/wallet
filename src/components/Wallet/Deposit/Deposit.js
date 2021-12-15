import './Deposit.scss'

import { useCallback, useEffect, useState } from 'react'
import { MdAccountBalance, MdAccountBalanceWallet } from 'react-icons/md'
import QRCode from 'qrcode'
import TextInput from '../../common/TextInput/TextInput'
import Providers from './Providers/Providers'

import networks from '../../../consts/networks'

export default function Deposit({ selectedAcc, selectedNetwork }) {
    const networkDetails = networks.find(({ id }) => id === selectedNetwork)
    const [qrCodeUrl, setQrCodeUrl] = useState('')

    const generateQRCode = useCallback(() => {
        QRCode.toDataURL(selectedAcc, {
            quality: 1,
            margin: 1
        }, (error, url) => {
            if (error) return console.error(error)
            setQrCodeUrl(url)
        })
    }, [selectedAcc])

    useEffect(() => generateQRCode(), [generateQRCode])

    return (
        <section id="deposit">
            <div className="panel">
                <div className="heading">
                     <div className="title">
                        <MdAccountBalanceWallet size={35}/>
                        Deposit Tokens
                    </div>
                    <div className="subtitle">
                        Direct Deposit
                    </div>
                </div>
                <div className="description">
                    <TextInput className="depositAddress" label="Send tokens or collectibles (NFTs) to this address:" value={selectedAcc} copy/>
                    <img id="qr-code" alt="QR Code" src={qrCodeUrl}></img>
                </div>
                <div className="separator"></div>
                <div id="networks">
                    Following networks supported:
                    <div className="list">
                        {
                            networks.map(({ id, icon, name }) => (
                                <div className="network" key={id}>
                                    <div className="icon" style={{backgroundImage: `url(${icon})`}}></div>
                                    <div className="name">{ name }</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
            <div className="panel">
                <div className="heading">
                    <div className="title">
                        <MdAccountBalance size={35}/>
                        Fiat Currency
                    </div>
                    <div className="subtitle">
                        Credit Card & Bank Transfer
                    </div>
                </div>
                <div className="description">
                    Deposit with credit card to your account directly using one of our partners
                </div>
                <Providers walletAddress={selectedAcc} networkDetails={networkDetails}/>
            </div>
        </section>
    )
}