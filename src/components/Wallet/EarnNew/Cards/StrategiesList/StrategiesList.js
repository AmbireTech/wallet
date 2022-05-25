import './StrategiesList.scss'
import { useEffect, useRef, useState } from 'react'
import Card from 'components/Wallet/EarnNew/Card/Card'

const StrategiesList = ({ networkId, selectedToken }) => {
    const currentNetwork = useRef()
    const [isLoading, setLoading] = useState(true)

    useEffect(() => {
        currentNetwork.current = networkId
        setLoading(true)
    }, [networkId])

    useEffect(() =>  setLoading(false), [])

    return (
        <Card
            loading={isLoading}
            large={!!!selectedToken}
        >
            <div className='strategies-list--empty'>
                <div className='strategies-how-to'>
                    <div>
                        <h4>WHAT IS STAKED TOKEN?</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis turpis. Integer interdum sed augue a aliquet. Donec tincidunt turpis quis lacus dignissim tincidunt. Integer at nulla magna. Praesent bibendum maximus sapien, non posuere diam. Donec consectetur tristique finibus.</p>
                    </div>
                    <div>
                        <h4>WHAT IS STAKED TOKEN?</h4>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis turpis. Integer interdum sed augue a aliquet. Donec tincidunt turpis quis lacus dignissim tincidunt. Integer at nulla magna. Praesent bibendum maximus sapien, non posuere diam. Donec consectetur tristique finibus.</p>
                    </div>
                </div>

                <div className='deposit-how-to'>
                    <h2 className='title'>Deposit</h2>

                    <section className="step-indicator">
                        <div className="step step1 active">
                            <div className='step-header'>
                                <div className="step-icon">1</div>
                                <div className="indicator-line active"></div>
                            </div>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className="step step2">
                            <div className='step-header'>
                                <div className="step-icon">2</div>
                                <div className="indicator-line"></div>
                            </div>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                        <div className="step step3">
                            <div className="step-icon">3</div>
                            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec arcu diam, facilisis ultricies gravida quis, semper nec sapien. Ut eget dolor dignissim, maximus tellus non, ornare dui. Nunc convallis neque nec libero venenatis facilisis vehicula lobortis.</p>
                        </div>
                    </section>

                </div>

                <div className='withdraw-how-to'>
                    <h2 className='title'>Withdraw</h2>
                </div>
            </div>
        </Card>
    )
}

export default StrategiesList
