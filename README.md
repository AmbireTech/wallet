## Ambire Wallet


### All documentation

* Smart contract documentation, originally intended for CodeArena: https://github.com/AmbireTech/code4rena
	* Latest smart contract source code: https://github.com/AmbireTech/adex-protocol-eth/tree/codearena-fixes
* Security model: https://gist.github.com/Ivshti/fe86f13c3adff3404a1f5ce1e364304c
* Tokenomics (confidential): https://gist.github.com/Ivshti/c6b93745dd0ba0d9c8256bc39769a601l
* Deck: https://docsend.com/view/qijz3atn4j43f3za
* FAQs: https://help.ambire.com/hc/en-us/categories/4404980091538-Ambire-Wallet
* Front-end (this repo) development plan and estimation: https://docs.google.com/spreadsheets/d/1pqtRPcNRW98D97GL3nrdoipD3sWehz2k7zWclzYk-SM
* Original concept: https://github.com/AdExNetwork/aips/issues/69 (note that the feature scope is not up to date)

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

### Internal data formats

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


### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
