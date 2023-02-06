![1](https://user-images.githubusercontent.com/8737960/163564503-db05549a-bb70-417f-b204-fd237a3f1442.png)

# How to create a plugin for Ambire Wallet
_Basic Intro Guide_

[Ambire](https://www.ambire.com/) is a next-generation open-source Web3 wallet focused on DeFi and the EVM ecosystem.

It brings to the table a number of innovative features like human-friendly transaction parsing, simplifying ERC20 approvals, hardware wallet support and much more. It’s also a smart wallet, enabling features like multiple signers, social recovery, transaction batching, gas abstractions and others.

We are happy to announce a soft launch of our plugin system **integrated and developed on the Gnosis protocol** (Safe App).

### Why should you build an Ambire Wallet plugin

We envision Ambire as the homepage of DeFi and this is why we created our plugin system. By adding your plugin to Ambire, you get the following benefits: 

- Getting in on the ground floor: the plugin system will be officially launched in Q4 of 2022 but you get a chance to get in during our soft launch and join our early adopters inner circle. 
- Tapping into the Ambire Wallet’s user base: we currently have 75,000 registered accounts and growing. 
- Marketing support: Our experienced marketing team will work with you to help promote the plugin and your participation in the Ambire ecosystem. 
- Development support: Our extremely competent developers will be available to assist you should you encounter a roadblock.
- Empower your users with excellent UX - they get to benefit from all of the fantastic features Ambire Wallet offers. 

![2](https://user-images.githubusercontent.com/8737960/163564510-a6c61b7c-44f2-4e1c-8b12-54b153537b23.png)

Check out Ambire Wallet here: https://wallet.ambire.com

---

### This document provide basic information how you can start with development of plugin for Ambire Wallet

First you can get a Gnosis react template and start with application Gnosis Safe App React Template.

After that maybe you will need to get the current identity address and current network for the wallet session.

```
import { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk'
...
const { safe } = useSafeAppsSDK()
const currentAddress = safe.safeAddress
const currentNetwork = safe.network
```

#### Example of how to send a transaction
```
import { useSafeAppsSDK, BaseTransaction } from '@gnosis.pm/safe-apps-react-sdk'
...
const { sdk, connected, safe } = useSafeAppsSDK();
const txs: BaseTransaction[] = [
 {
   to: '0x31415629...',
   value: '0',
   data: '0xbaddad',
 },
 //...
];
const safeTxHash: string = await sdk.txs.send({ txs });
```

#### Example of batching transactions
```
import { useSafeAppsSDK, BaseTransaction } from '@gnosis.pm/safe-apps-react-sdk'
...
const { sdk, connected, safe } = useSafeAppsSDK();
const txs1: BaseTransaction[] = [
 {
   to: '0x31415629...',
   value: '0',
   data: '0xbaddad',
 },
 //...
];
 
const txs2: BaseTransaction[] = [
 {
   to: '0x12214312...',
   value: '0',
   data: '0xabc123',
 },
 //...
];
const safeTxHash1: string = sdk.txs.send({ txs: tnx1 });
const safeTxHash2: string = await sdk.txs.send({ txs: tnx2 });
```

#### Example of gas estimation
```
import { useSafeAppsSDK, BaseTransaction } from '@gnosis.pm/safe-apps-react-sdk'
...
const { sdk, connected, safe } = useSafeAppsSDK();
const currentAddress = safe.safeAddress
const estimatedTransferGas = await sdk.eth.getEstimateGas({
   to: '0x31415629...',
   value: '0',
   data: '0xbaddad',
   from: currentAddress,
});
```

#### Useful links 
- [Safe App SDK](https://github.com/gnosis/safe-apps-sdk)
- [Safe App documentation](https://docs.gnosis-safe.io/build/sdks/safe-apps)

### Testing the application
You can run your plugin at this address: https://wallet.ambire.com/#/wallet/dapps

![Add custom dApp](https://user-images.githubusercontent.com/83211172/216987050-641d8fae-6dfa-4dd5-9039-e355eee94dbc.png)

If you deployd your plugin on public address you can load it by click at “Add custom dApp” and fill address in modal form:

![Add custom dApp menu with example](https://user-images.githubusercontent.com/83211172/216987890-f6a21da2-ecf1-4502-9603-f72e870b97ff.png)

If the plugin is loaded correctly then the user can start interacting with it.

![Add custom dApp - added](https://user-images.githubusercontent.com/83211172/216987343-864e6f2d-084b-481b-8f35-25a28169e1c2.png)

### Balances provider
One of the main features that maybe you will need is to get the current balances (for most ERC20/BEP20/etc. tokens) for an account for the current network. We suggest using our own balance provider named Velcro.
```
https://velcro.ambire.com/v1/protocols/${PROTOCOL}/balances?addresses[]=${IDENTITY_ADDRESS}&network=${NETWORK_NAME}
```

For **PROTOCOL** you can use “tokens” or “nft”.

For **IDENTITY_ADDRESS** you have to use current Ambire Wallet identity address. 

For **NETWORK_NAME** you have to use one of Ambire Wallet supported networks:
- ethereum
- polygon
- fantom
- binance-smart-chain
- avalanche
- moonbeam
- moonriver

---

#### Have questions? Get in touch: 
- [Ambire on Discord](https://discord.gg/nMBGJsb)
- [Chat to us on Telegram](https://t.me/AmbireOfficial)

