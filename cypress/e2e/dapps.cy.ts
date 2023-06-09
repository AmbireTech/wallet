describe('dApps', () => {
  before(() => {
    cy.login();
    cy.saveLocalStorage();
  })

  beforeEach(() => {
    cy.restoreLocalStorage();

    // First we get WalletConnect URI and store it at `wcUrl` variable
    cy.origin('https://example.walletconnect.org/', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'log').as('consoleLog')
          cy.stub(win, 'prompt').returns(null)
        }
      })

      cy.contains('Connect to WalletConnect').click()
      cy.contains('Copy to clipboard').click()

      // Before adding the wait time here, the WalletConnect uri was expiring in 3/10 cases,
      // and we couldn't establish a connection between the dApp and Wallet.
      // The assumption is that WalletConnect QR modal kills the uri in the case we close the dApp page very quickly.
      cy.wait(1000)

      cy.get('@consoleLog')
          .invoke('getCalls')
          .then((calls) => {
            cy.task('setWcUrl', calls[0].lastArg)
          })
    })
  })

  it('Connects to a dApp', async() => {
    const wcUrl = await cy.task('getWcUrl')

    cy.visit('/wallet/dashboard')

    // Wait for the initial wallet load
    cy.wait(1000)

    cy.window().then(win => {
      cy.stub(win, 'prompt').returns(wcUrl)
    })

    cy.get('[data-testid="dapp-dropdown"]').click()
    cy.get('[data-testid="connect-btn"]').click()

    cy.contains('Successfully connected to WalletConnect Example').should('be.visible')
  })
})