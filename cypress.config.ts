import { defineConfig } from "cypress";
import { ImapFlow } from 'imapflow';

// Cypress doesn't work very well with cross-origin testing (different domains).
// In order to test dApp connection, we need to get WalletConnect uri from the dApp page and pass it to the Wallet.
// Because of that - we have this variable here, and we set/get its value through setWcUrl/getWcUrl tasks in the tests.
let wcUrl;

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000/',
    experimentalSessionAndOrigin: true,
    includeShadowDom: true,
    // macbook 13
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on, config) {
      on("task", {
        "get-confirm-code": async () => {
          const [{ email }] = config.env.ACCOUNTS;

          const client = new ImapFlow({
            host: 'mail.devlabs.bg',
            port: 993,
            secure: true,
            auth: {
              user: email,
              pass: config.env.EMAIL_PASSWORD,
            },
            logger: false,
          });

          return new Promise(async resolve => {
            // Wait until client connects and authorizes
            await client.connect();

            await client.mailboxOpen('INBOX');

            // It returns all the emails' sequences (email index) matching the search criteria
            const confirmEmails = await client.search({
              from: 'no-reply@ambire.com',
              subject: 'Transaction confirmation code',
            });

            // Most recent email is the email having the highest sequence
            const mostRecentConfEmail = Math.max(...confirmEmails);

            // Get most recent email content
            const { content } = await client.download(mostRecentConfEmail);

            content.on('data', chunk => {
              const body = chunk.toString();
              // Extract the code from the following msg 'Please copy this confirmation code to sign it: {code}.'
              const code = body.match(/Please copy this confirmation code to sign it: (.*)\./)[1];

              resolve(code);
            });

            // Log out and close connection
            await client.logout();
          });
        },
        setWcUrl: url => {
          return (wcUrl = url);
        },

        getWcUrl: () => {
          return wcUrl;
        },
      });
    },
  },
});
