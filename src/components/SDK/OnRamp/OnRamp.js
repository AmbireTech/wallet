import { useState } from 'react'
import networks from 'ambire-common/src/constants/networks'

import binanceNetworks from './helpers/binanceNetworks'
import { networkIconsById } from 'consts/networks'
import { fetchPost } from 'lib/fetch'

import { useLocalStorage, useAccounts } from 'hooks'
import { Button, Select } from 'components/common'

import { ReactComponent as Illustration } from './images/illustration.svg'

import styles from './OnRamp.module.scss'

const OnRamp = ({ relayerURL }) => {
	const { selectedAcc } = useAccounts(useLocalStorage)
	// const chosenNetwork = React.createRef()
	const [selectedNetwork, setSelectedNetwork] = useState(null)
	const networkItems = networks
		.filter((network) => network.id in binanceNetworks)
		.map((network) => ({
			value: binanceNetworks[network.id],
			label: network.name,
			icon: networkIconsById[network.id]
		}))

	const handleBuyCrypto = async () => {
		if (!selectedNetwork) return

		const fetchData = await fetchPost(`${relayerURL}/binance-connect/sign`, {
			address: selectedAcc,
			networkCode: selectedNetwork
		})
		const signature = encodeURIComponent(fetchData.signature)
		const { merchantCode, timestamp } = fetchData

		const iframeUrl = `https://www.binancecnt.com/en/pre-connect?merchantCode=${merchantCode}&timestamp=${timestamp}&cryptoAddress=${selectedAcc}&cryptoNetwork=${selectedNetwork}&signature=${signature}`
		window.open(iframeUrl, 'binance-connect', 'menubar=1,resizable=1,width=400,height=640')
	}

	const handleFinalize = () => {
		window.parent.postMessage(
			{
				address: selectedAcc,
				type: 'finishRamp'
			},
			'*'
		)
	}

	return (
		<div className={styles.wrapper}>
			<h1 className={styles.title}>Do you want to buy crypto?</h1>
			<Illustration className={styles.illustration} />
			<Select
				items={networkItems}
				onChange={({ value }) => setSelectedNetwork(value)}
				defaultValue={selectedNetwork}
				className={styles.select}
				selectInputClassName={styles.selectInput}
				selectMenuClassName={styles.selectMenu}
			/>
			<div className={styles.buttons}>
				<Button primaryGradient small className={styles.button} onClick={handleBuyCrypto}>
					Buy Crypto with Fiat
				</Button>
				<Button border small className={styles.button} onClick={handleFinalize}>
					Continue to application
				</Button>
			</div>
		</div>
	)
}

export default OnRamp
