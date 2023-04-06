## Ambire Wallet

### About
Ambire Wallet is a self-custodial crypto wallet designed with power and ease of use in mind. Unlike most crypto wallets, Ambire focuses on user experience and human-friendliness, while not compromising on features. Ambire is unopinionated, it can be connected to any dApp and it supports most of the popular EVM networks. Ambire is also a Web3 superapp: you can swap, lend, borrow, perform cross-chain transfers, deposit FIAT, all without the app.

It's built on smart contract wallet technology, enabling powerful features such as transaction batching, account recovery, multisigs, key rotation and paying for transactions in stablecoins (gas abstractions).

### All documentation

* Smart contract documentation, originally intended for CodeArena: https://github.com/AmbireTech/code4rena
	* Latest smart contract source code: https://github.com/AmbireTech/adex-protocol-eth/tree/codearena-fixes
* Security model: https://gist.github.com/Ivshti/fe86f13c3adff3404a1f5ce1e364304c
* Deck: https://docsend.com/view/hqp9xkr2krj6wt8w
* FAQs: https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet
* Front-end (this repo) development plan and estimation: https://docs.google.com/spreadsheets/d/1pqtRPcNRW98D97GL3nrdoipD3sWehz2k7zWclzYk-SM
* Original concept: https://github.com/AdExNetwork/aips/issues/69 (note that the feature scope is not up to date)
* [UX decisions](#ux-decisions)

## Running

**NOTE: make sure that you use the `wallet-v2` branch of the relayer.**

**NOTE 2: we test on Polygon,** because it's cheap enough and it's a real environment with all the supported protocols - Sushiswap, Uniswap, Aave, and others. Ping #dev-wallet channel on Slack so we can send you some MATIC tokens.

### Running the relayer
**IMPORTANT: if you are running from public repositories, and do not have access to the relayer, please skip this step and run in relayerless mode!**

First, clone and run the relayer
```
git clone https://github.com/AmbireTech/relayer.git -b wallet-v2
cd relayer
npm i
NODE_ENV=development npm start
```

### Running the wallet

Then run the Ambire Wallet:
```
npm i
npm start
```

### Relayerless mode

In order to enable Relayerless mode (_ability to function without being connected to the relayer_), you need to set `REACT_APP_RELAYER_URL` env variable to null as follows:
```dotenv
REACT_APP_RELAYER_URL=
```

### Testing Ledger

**Important:** to make the Ledger integration work, you need to be accessing Ambire Wallet through HTTPS. The easiest way to do this in a development environment is to [use localtunnel](https://github.com/localtunnel/localtunnel): for example, `lt --port 3000`

## Building plugins

To see how to build plugins for Ambire, please [read our plugin docs](/how-to-create-a-plugin.md).

## Code style and recommendations

* No semicolons
* 2 spaces for identation
* Single quote (') instead of double (")
* Error handling: make sure to catch all errors that may originate in external IO (expected errors) and display them in a human friendly way with `addToast`; also, at a top-level, every time you spawn an async operation, make sure you `.catch` the entire thing to catch unexpected errors
* Camel case

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## UX decisions

### Terms
* Signer: the signer is an address used to sign transactions and messages. It's normally an EOA (externally owned address) such as a Trezor address, Ledger address, Metamask address, a double-keypair representing an email/passphrase authentication, or even another smart wallet address (eg Gnosis Safe). We use this term to distinct it from "account", which is the actual smart wallet account, which can have one or more signers.


### Multi-account behavior
* When adding an account with Trezor, Ledger or a web3 wallet, we create one automatically if it doesn't exist; if we control multiple, we add all those accounts and show a toast notification "this key controls N accounts"
* We also auto-add all accounts FORMERLY controlled by the connected signer
* When trying to sign a transaction/message with an added account, and the signer is not available, we show a toast notification explaining to the user they have to connect the relevant signer; unless it's a HW Wallet, in which case we can just prompt the user to connect it
* When an account is added with a signer, but that signer no longer controls it, we should warn the user: "You are currently not authorized to send transactions from <> on <network>. Please re-add the account with a key that controls it."
* If someone goes through "add account"/"email login" but the given account is already added, we won't attempt to warn them early; the reason for this is 1) for simplicity and 2) cause re-adding an acc will change to the latest used signer (eg former quickacc, readding as trezor-controlled) 3) cause re-adding an account might reset it's state and fix tech issues in the future


## Internal data formats

#### Account
```
{
	id, // address (checksummed) of the account itself
	signer, // object, either { address } or { quickAccManager, one, two, timelock }
        salt, identityFactoryAddr, baseIdentityAddr, bytecode // all hex strings, account identity deploy data; all required
	email, // optional: only in case of quick accounts
        primaryKeyBackup, // optional, only in case of quick accounts, stringified JSON in a keystore format
}
```

#### Signing request

This is used by the WalletConnect and Gnosis Safe Apps hooks for the queue of signing requests: those could be transactions, personal messages, etc.

```
{
	id, // numeric unique ID of the request
	type, // type of the signing request, currently set to the RPC method (eg eth_sendTransaction)
	txn, // only set when it's eth_sendTransaction, contains to/data/value/gas
	chainId, // chainId the request is for
	account, // account address the request is for
}
```

`resolveMany` response:
```
{
	success, // boolean
	message, // string, optional, if success is false
	result, // string or object, optional, if success is true, depending on the request; normally a string, eg eth_sendTransaction would be answered with a hex hash (0x...)
}
```


## Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Audits

The contracts used by Ambire Wallet have been audited by:
* [CertiK](./contracts/audits/Certik.pdf)
* [CodeArena](https://code423n4.com/reports/2021-10-ambire/)
* [G0 group](https://github.com/g0-group/Audits/blob/master/AdExNetwork.md): audited AdEx Network but the used Identity.sol was carried over to Ambire

Additionally, there's an ongoing [Immunefi bug bounty](https://immunefi.com/bounty/ambire/).

## Deployed contracts
* Factory: 0xBf07a0Df119Ca234634588fbDb5625594E2a5BCA
* Base identity: 0x2A2b85EB1054d6f0c6c2E37dA05eD3E5feA684EF
* QuickAccManager: 0xfF3f6D14DF43c112aB98834Ee1F82083E07c26BF
* Batcher: 0x460fad03099f67391d84c9cc0ea7aa2457969cea
* WALLET token: 0x88800092ff476844f74dc2fc427974bbee2794ae
* xWALLET staking: 0x47Cd7E91C3CBaAF266369fe8518345fc4FC12935
* xWALLETSpendable: 0x0b62eC5F3b445d2CDd024E736c3f4f1f92be43fd
* SupplyController: 0x6FDb43bca2D8fe6284242d92620156205d4fA028
* adexStakingSpendable: 0x2685DdE658fAA0465130bC1672904d32c42cecb7

Those contracts (except Ethereum-specific WALLET, xWALLET and SupplyController) are deployed cross-chain on the same addresses across Ethereum, Polygon, BSC, Fantom, Avalanche, Arbitrum, Moonbeam, Moonriver, Cronos, Metis, Gnosis Chain (formerly xDAI), NEAR Aurora

## Change log

### First private beta (v0.1.0)

* Email/password accounts
* Ledger support
* Trezor support
* Can create an account with a Web3 wallet
* Multiple accounts
* Multiple networks: Ethereum, Polygon, Avalanche
* WalletConnect v1
* WalletConnect: multi-dApp support
* Transaction preview: transactions parsed to display meaning
* Transaction batching: add multiple transactions to automatically batch them
* Notifications for pending to sign, ability to click notifications to go directly to the tab
* Deposit page
* Deposit through on-ramps
* Transfer page: send tokens
* Dashboard: display all tokens you own with their $ values
* Dashboard: display all NFTs you own
* Plugin system: iframe-based plugins supported
* Swap: ability to swap tokens through an embedded Sushiswap plugin
* Earn: ability to easily deposit/withdraw to and from Aave
* Security: add/remove authorized signers
* Relayerless mode: ability to function without being connected to the relayer
* Fee payment in stablecoins: auto-detects what tokens you have left after your transaction batch
* Transactions: list all the transaction history
* OTP (Authenticator) support for extra security with email/pass accounts

### First sprint (v0.2.0)

* Ability to copy the address from the top left
* Ability to remove accounts
* Transaction cancellation and speed-up
* Fix: relayer: better gas estimations to avoid "out of gas", "execution reverted"
* Ability to sign messages
* Swap: approve tokens automatically, removing the need for a separate transaction batch
* Notifications for incoming funds
* Advanced transaction parsing: more types of transactions understood and displayed in human-friendly manner
* Welcome email & onboarding UX improvements
* Permissions (clipboard, notifications) are now requested through a modal
* Security: ability to add additional signers and remove signers
* Attention grabbing: pinned notification in the bottom right if you have requests pending to be signed
* Ability to deploy smart contracts
* Address book: ability to save and label addresses
* Ledger: WebHID support, fixing Ledger with Chrome
* Email verification is now enforced with a modal, because a valid email is required for account recovery
* Binance Smart Chain support added
* Ability to change your password
* Ability to export (backup) and import accounts to/from JSON files
* Styling improvements: responsiveness

### Second sprint (v0.3.0)
* Ability to recover your account in case of losing one of the keys
* OTP (Google Authenticator) support in the Security page
* Notifications for confirmed (mined) transactions
* Cross-chain transfer and swap support
* Improved responsiveness, mobile-friendly UI (not intended as a replacement to the upcoming mobile app)
* Yearn integration: you can now deposit into Yearn vaults through the Earn page
* QR Code on Deposit page
* WALLET token distribution modal
* Link to the Help Center added
* Top right dropdown with helpful links
* Improved parsing of Uniswap V3 transactions following their updated router

### Third sprint (v0.4.0)
* Ability to add custom tokens
* More frequent updating of balances
* Ability to ask for your confirmation email to be resent
* Warn when a WalletConnect connection may be offline
* Cross-chain transfers are now tracked

### v0.4.1
* Cross-chain: select box can now be easily searched
* Private mode (hide the numbers on the dashboard)
* Earn: add Tesseract, a yield aggregator on Polygon
* NFTs now show up on Polygon

### v0.4.2
* Ability to remove custom tokens
* Redesigned UI for sending transactions
* Warn users when there's extra transaction costs for deploying their wallet
* Private mode: hide addresses as well

### v0.4.3
* Fee improvements: ability to set a custom fee
* Fee improvements: ability to select a lower fee if you don't have sufficient funds for the higher settings
* Ability to replace the current transaction
* Ability to queue a new transaction when you have one pending
* $WALLET claiming: can now claim early investor tokens
* Bugfix: fixed parsing Aave repay transactions
* Support for Fantom

### v0.4.4
* $WALLET: Ability to stake (xWALLET)
* $WALLET: Ability to pay transaction fees in $WALLET
* Grid+ Lattice hardware wallet support
* $WALLET claiming: show APYs
* More token icons

### v0.4.5
* Improvements to $WALLET staking: better stats
* Ability to hide tokens in the dashboard

### v0.5.0
* Support UnstoppableDomains as a transaction address
* ADX staking card improvements
* Kriptomat as new on-ramp provider
* Added Hop.exchange LP tokens for wallet rewards
* Provided token prices for Moonbeam network

### v0.5.1
* Gas prices modal: you can now see the current gas price
* Fee selector: now shows all fee tokens, not only the ones you have
* UX improvement: top button for WALLET rewards now shows pending to be received, instead of claimable
* Critical WalletConnect fix
* Portfolio balances bugfixes

### v0.5.2
* Added Gnosis Chain
* Drag & Drop ordering for tokens addresses and networks
* Unstoppable Domains support in the Address book
* Error screen in case of an unexpected crash
* Fix bug when sending NFTs
* Can display balances on networks not supported by our providers
* Support NFT on Binance Smart Chain

### v0.5.3
* Added KCC (KuCoin) Chain
* Attach xWallet metadata in transactions (current APY, shared value, price in USD)
* Added warning notifycation on signing message form when wallet contract still not deployded
* Cached asset prices in memory
* Implement EIP 712
* Fix non clickable address area
* Fix bug when using UD in batch transactions
* Added Avalanche AAVE for wallets rewards

### v0.5.4
* Added new option for migration assets from Metamask
* Added Arbitrum chain
* Added Optimism Network
* Implement sign messages EIP 712 - https://www.npmjs.com/package/is-valid-signature
* Custom banner improvments
* New tokens added in custom tokens for "balance oracle"
* Fixed: Disable fee selector when proceed to sign step with external signer
* Fixed: the "Undefined" APY in Earn

### v0.5.5
* xWALLET Pending unbonds gas fees fix
* Change signer assets migration process
* Added Ledger signer assets migration
* Show discount banner only if eligible
* Support balance for custom NFTs for netwroks without thirdparty balance providers
* Added multiplier for CryptoTester NFT
* Added pagination for Collectibles page
* Changed Kriptomat limit to 5k per day
* Added new tokens BSC on for rewards

### v0.5.6
* Supported hidden networks
* Added Andromeda chain
* Improved humanizer with custom list of eligible tokens
* Added Trezor and Lattice signer assets migration
* Added Transak support for Moonbeam, Moonriver and Optimism chains
* Asset migration improvement to migration with Permit method
* Added chain verification of sign message
* Alphabetically sort of tokens in Transfer page
* Fixed: Support Pancakeswap through WalletConnect
* Improve replacment transaction interface

### v0.5.7
* Added ENS support
* We now notify users in case the contract they're interacting with intentionally blocks smart wallets, as is the case with many NFT mints
* Improvement sign message page and verification for deployed contract
* Disable deposit option for Tesseract earn
* Fixed: Allow to list more then 8 dapps in dapps connection bar
* Fixed: Notification errors on Chrome browser on Android mobile


### v0.5.8
* Gas-Tank
* Changed the address of the adx-supply-controller
* New AdEx staking supply controller 
* Password recovery alert on dashboard
* Start using shared repo
* Different visual for Production and Staging
* Disabled deposit yearn/tesseract btn for polygon
* Thank you page
* Migrate const to shared repo
* Migrate portfolio to shared repo
* Migrate address, approveToken and requestToBundleTxn to shared repo
* topUp gasTank with AAVE tokens
* Added Guardarian as on-ramp and off-ramp provider
* Improve token hiding functionality
* Added Polygon and Avalanche as kriptomat supported chains
* Allow XDAI on Ramp for Gnosis chain
* Fix: Dapp scrollbar fix disconnect alignment
* Fix: The send txn is not allowed if missing amount
* Fix: Adx staking details
* Fix: popping up the addresses modal when add new signer via Trezor
* Fix: AAVE earn card

### v0.6.0
* Redesign the dark theme
* New dapps section
* Added support for relayerless chains only
* Added ethpow chain for relayerless
* Upgraded "trezor-connect": "^8.2.8" to "@trezor/connect-web": "^9.0.2"
* Added new params for feeTokens: disableGasTankDeposit and disableAsFeeToken
* Sign message - supporting custom typed data v4 call
* Hide token modal not closing when clicking on the side
* Earn card minor fixes in text
* Optimize bundle size
* switch from claim to claimWithRootUpdate for rewards
* SignatureValidator fix
* Dapps message for sign message unsupported dapps
* Trezor manifest
* Send transaction gasTank badge improvement
* Wc 2.0 implementation
* Added signMessage history
* Swappin as offramp
* Offramp section in transfer page
* Added copy button next to current identity address
* Refactore sign message hook - move into common repo
* New rewards modal
* QuickAccManager: fix cancelability
* Feature / Configurable Providers
* Provide param to relayer for estimation isGasTankEnabled
* New Swap release based by Uniswap v2 and v3
* Socket v2 API
* humanizer - Uniswap v2 & v3 improvements & AAVE address
* Aapps iframe allow copy & paste
* On creating account with MM, added a option to choose the address from MM if have more then one.
* Update uniswap integrated swap with working v2 routing.
* Portfolio V2 and dashboard redesign with pending balances by pending and unsigned transactions.
* Fix / View amount in the rewards button
* Fix / On a Signer removal button click, hide the modal
* Fix / Change signers error message
* Fix / Infinitive Gas tank loading indicator
* Fix / Native fees decimals numbers in sign txn
* Fix / NFT images from ipfs by hash
* Fix / Handle error if WalletConnect if session is not initialized
* Fix / Wallet stacking unbond period
* Fix / Gas-tank top up
* Fix / Bug fixed removed xWallet from feeAssets in gas tank
* Fix / Styles email confirm view in Add Account page
* Fix / Wallet staking unbond period
* Fix / Now the wallet token is on first position in a fee assets list
* Fix / Change github Workflow on deploy to not remove stagings folders
* Fix / Multiple requests on earn page in Aave card

### v0.6.1
* Assets Migration - redesign, increased gasLimit for native and erc20 tokens.
* Lattice pairing - redesign + reusing the repetitve logic into a hook.
* Choosing a Signer list (on Add Account and Security) - redesign.
* Signed Messages - improve responsiveness, code readability and markup.
* Addressbook search.
* Disable Code Splitting.
* Github workflow for auto deploying PR previews.
* Memoizing DApps, Balances, Link components, because of performance reasons.
* Modified Unirouter humanizer. Now it's showing "Swap X.X USDT for at least X.XXX matic" instead of "Swap 3.0 USDT for at least 3.760145095713324034 matic and send it to "0xxxxx" Unwrap at least X.X matic"
* Restore email confirmation in permission modal - because of already existing, old accounts which would be not confirmed yet.
* Arbitrum gas limit mod.
* Fix Dashboard last update value to 23hour format.
* Fix Metamask addresses query (MM 9.8.4) - depending on the MM version, the addresses are returned by a different caveat identifier.
* Fix Tabs shadow overlaping with content.
* Fix Movr humanizer bug.
* Fix Dashboard tokens sort icons color and alignment.
* Fix Accounts menu on logout when logged in with a single account (Topbar).
* Fix Topbar accounts twitching when toggling private mode.
* Fix Collectible name is missing from data and add fallback.
* Change Dashboard text to trigger Add token modal - If you don't see a specific token that you own, please add it manually.

### v0.6.2
- 4337 implementation in Identity.sol
- Fixed an issue where approvals didn't succeed in the official UI of Uniswap
- improvement / tnxs preview for mobile devices
- improvement / Add or Remove Token button if user don't have any assets on current chain.
- fix / apply white list for sign message for EIP 1271 support 
- fix / signed message and sigHash can be selectable for copy
- redesign / promo banners

### v0.7.0
- OKX Chain support added.
- Sepolia Chain support added as testnet.
- Fixed namespaces for Wallet Connect v2 connections with dApps.
- Improve wallet responsiveness.
- UX optimization for 4k.
- Optimizations of visual elements.
