const codes = {
    // Humanize the default MM error message for error code `-32002`.
    // The default message is: `Request of type 'wallet_requestPermissions' already pending for origin https://wallet.ambire.com. Please wait.`
    // This error occurs in the case the user initializes an MM request for accessing the Accounts, but minimizing MM (without choosing an Account),
    // and after that clicks on MM button again and tries to initialize a new MM request.
    '-32002': 'There is a connection to Metamask pending approval in the background. Please open your Metamask window.'
}

const humanizeError = e => {
    const message = codes[e?.code]

    return message
}

export default humanizeError