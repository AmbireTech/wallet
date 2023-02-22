import { defineConfig } from "cypress"
import { ImapFlow } from 'imapflow'

// Cypress doesn't work very well with cross-origin testing (different domains).
// In order to test dApp connection, we need to get WalletConnect uri from the dApp page and pass it to the Wallet.
// Because of that - we have this variable here, and we set/get its value through setWcUrl/getWcUrl tasks in the tests.
let wcUrl

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000/#',
    experimentalSessionAndOrigin: true,
    setupNodeEvents(on, config) {
      on("task", {
        "get-confirm-code": async () => {
          const client = new ImapFlow({
            host: 'mail.devlabs.bg',
            port: 993,
            secure: true,
            auth: {
              user: 'ambire-tests@devlabs.bg',
              pass: 'ClB95d!tr}v^'
            },
            logger: false
          })

          return new Promise( async resolve => {
            // Wait until client connects and authorizes
            await client.connect()

            await client.mailboxOpen('INBOX')

            // Get most recent email
            const { content } = await client.download('*')

            content.on('data', chunk => {
              const body = chunk.toString()
              // Search for a string starting with 'Please copy...' and ending with 'This code ...'.
              const confirmMsg = body.match(/Please copy this confirmation code to sign it:([^]*?)This code is only valid for 3 minutes/)[0]
              // Extract the code from the confirmation message string
              const code = confirmMsg
                  .replace('Please copy this confirmation code to sign it:', '')
                  .replace('This code is only valid for 3 minutes', '')
                  .replace(/(\r\n|\n|\r)/gm, '')

              resolve(code)
            })

            // Log out and close connection
            await client.logout()
          })
        },
        setWcUrl: url => {
          return (wcUrl = url)
        },

        getWcUrl: () => {
          return wcUrl;
        }
      });
    },
  },
});