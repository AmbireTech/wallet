import { Wallet } from 'ethers'

describe('Transfering funds', () => {
  before(() => {
    cy.login()
    cy.saveLocalStorage()
  })

  beforeEach(() => {
    cy.restoreLocalStorage()
  })

  it('Sends funds via Quick account', () => {
    cy.visit('/wallet/dashboards')
    cy.contains('Send').click()

    // Wait for the initial wallet load.
    // There are a lot of fetch requests under the hood.
    // In the case we don't wait enough time, and we start typing into input,
    // the wallet gets re-rendered (because of the initial requests)
    // and we loose input focus and the tests are failing.
    cy.wait(30000)

    cy.get('[data-testid="amount"]').clear().type('0.0000001')
    // Here we are sending funds to a random Recipient's address intentionally,
    // in order to overcome the Relayer logic regarding sending funds to a known address (3 or more txns sent to the same address).
    // If so (3+ txns) - the confirmation code is skipped and our test will fail.
    cy.get('[data-testid="recipient"]').type(Wallet.createRandom().address)
    // Wait a bit, because of React re-renders, both checkboxes are not visible immediately
    cy.wait(2000)
    cy.get('[data-testid="unknownAddressWarning"]').click({ force: true })
    cy.get('[data-testid="binance-address-warning-label"]').click()
    cy.get('[data-testid="send"]').click()

    cy.wait(2000)

    cy.get('[data-testid="approveTxn"]').click()
    cy.get('[data-testid="password"]').type(Cypress.env('ACCOUNT_PASSWORD'))

    // Wait for the email code.
    // Later we can make a polling mechanism for checking the code, instead of waiting 30 seconds.
    cy.wait(30000)

    cy.task('get-confirm-code').then((code) => {
      cy.get('[data-testid="confirmationCode"]').type(code)
      cy.get('[data-testid="confirmSigning"]').click()

      cy.wait(6000)

      cy.get('[data-testid="txnSignedMsg"]').should('be.visible')
    })
  })
})
