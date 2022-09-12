import { defineConfig } from "cypress";
import gmail_tester from "gmail-tester";
import path from "path";

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
        "gmail:get-messages": async args => {
          return await gmail_tester.get_messages(
              path.resolve(__dirname, "credentials.json"),
              path.resolve(__dirname, "token.json"),
              args.options
          );
        },
        "gmail:refresh-token": async () => {
          await gmail_tester.refresh_access_token(
              path.resolve(__dirname, "credentials.json"),
              path.resolve(__dirname, "token.json")
          )

          return null;
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