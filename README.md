## Ambire Wallet


### All documentation

* Getting started user guide: https://www.grnewsletters.com/archive/b9fc021c37e5656340e2136f9c4f1153/You-are-invited-to-Ambire-Beta-1043499604.html
* Smart contract documentation, originally intended for CodeArena: https://github.com/AmbireTech/code4rena
	* Latest smart contract source code: https://github.com/AmbireTech/adex-protocol-eth/tree/codearena-fixes
* Security model: https://gist.github.com/Ivshti/fe86f13c3adff3404a1f5ce1e364304c
* Tokenomics (confidential): https://gist.github.com/Ivshti/c6b93745dd0ba0d9c8256bc39769a601
* Deck: https://docsend.com/view/hqp9xkr2krj6wt8w
* FAQs: https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet
* Front-end (this repo) development plan and estimation: https://docs.google.com/spreadsheets/d/1pqtRPcNRW98D97GL3nrdoipD3sWehz2k7zWclzYk-SM
* Original concept: https://github.com/AdExNetwork/aips/issues/69 (note that the feature scope is not up to date)
* [UX decisions](#ux-decisions)

## Running

**NOTE: make sure that you use the `wallet-v2` branch of the relayer.**

**NOTE 2: we test on Polygon,** because it's cheap enough and it's a real environment with all the supported protocols - Sushiswap, Uniswap, Aave, and others. Ping #dev-wallet channel on Slack so we can send you some MATIC tokens.

First, clone and run the relayer
```
git clone https://github.com/AmbireTech/relayer.git -b wallet-v2
cd relayer
npm i
NODE_ENV=development npm start
```

Then run the Ambire Wallet:
```
npm i
npm start
```

### Testing Ledger

**Important:** to make the Ledger integration work, you need to be accessing Ambire Wallet through HTTPS. The easiest way to do this in a development environment is to [use localtunnel](https://github.com/localtunnel/localtunnel): for example, `lt --port 3000`

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
* Signer: the signer is an actual keypair used for authentication. Also called an "EOA" (externally owned address). For example, a signer could be a Trezor address, Ledger address, Metamask address, or a double-keypair representing an email/passphrase authentication. We use this term to distinct it from "account", which is the actual smart wallet account.

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

## Maintenance

### Updating contract/token info

```
node scripts/generateContractInfo.js > src/consts/humanizerInfo.json
```

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
