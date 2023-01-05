import BaseAddAccount from 'components/AddAccount/AddAccount'

export default function AddAccount({ relayerURL, onAddAccount, utmTracking, pluginData }) {
  return (
    <BaseAddAccount
      relayerURL={relayerURL}
      onAddAccount={onAddAccount}
      utmTracking={utmTracking}
      pluginData={pluginData}
      isSDK={true}
    ></BaseAddAccount>
  )
}