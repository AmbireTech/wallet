describe('dApps', () => {
  before(() => {
    cy.login()
    cy.saveLocalStorage()
  })

  beforeEach(() => {
    cy.restoreLocalStorage()

    // First we get WalletConnect URI and store it at `wcUrl` variable
    cy.origin('https://se-sdk-dapp.vercel.app/', () => {
      cy.visit('/', {
        onBeforeLoad(win) {
          cy.stub(win.console, 'log').as('consoleLog')
        }
      })

      cy.contains('eip155:80001').click()
      // Before adding the wait time here, the WalletConnect uri was expiring in 3/10 cases,
      // and we couldn't establish a connection between the dApp and Wallet.
      // The assumption is that WalletConnect QR modal kills the uri in the case we close the dApp page very quickly.
      cy.wait(1000)

      cy.get('wcm-modal-header').shadow().find('[class="wcm-action-btn"]').click()

      cy.wait(1000)

      cy.get('@consoleLog')
        .invoke('getCalls')
        .then((calls) => {
          cy.task('setWcUrl', calls[1].lastArg)
        })
    })
  })

  it('Connects to a dApp', () => {
    cy.task('getWcUrl').then((wcUrl) => {
      cy.visit('/wallet/dashboard')

      cy.url().should('include', '/wallet/dashboard') // Wait for URL to include '/wallet/dashboard'

      cy.window().then((win) => {
        cy.stub(win, 'prompt').returns(wcUrl)
      })

      cy.get('[data-testid="dapp-dropdown"]').click()
      cy.wait(1000)

      cy.get('[data-testid="connect-btn"]').click()
      cy.wait(2000)

      cy.contains('React App with ethers').should('be.visible')
    })
  })
})
