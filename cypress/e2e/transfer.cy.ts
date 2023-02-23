import { Wallet } from 'ethers'

describe('Transfering funds', () => {
  before(() => {
    cy.login();
    cy.saveLocalStorage();
  })

  beforeEach(() => {
    cy.restoreLocalStorage();
  })

  it('Sends funds via Quick account', () => {
    cy.visit('/wallet/transfer')

    // Wait for the initial wallet load
    cy.wait(3000)

    cy.get('[data-testid="amount"]').clear().type('0.0000001')
    // Here we are sending funds to a random Recipient's address intentionally,
    // in order to overcome the Relayer logic regarding sending funds to a known address (3 or more txns sent to the same address).
    // If so (3+ txns) - the confirmation code is skipped and our test will fail.
    cy.get('[data-testid="recipient"]').type(Wallet.createRandom().address)
    cy.get('[data-testid="unknownAddressWarning"]').click({force: true})
    cy.get('[data-testid="binance-address-warning-label"]').click()
    cy.get('[data-testid="send"]').click()

    cy.wait(2000)

    cy.get('[data-testid="approveTxn"]').click()
    cy.get('[data-testid="password"]').type(Cypress.env('ACCOUNT_PASSWORD'))

    // Wait for the email code.
    // Later we can make a polling mechanism for checking the code, instead of waiting 10 seconds.
    cy.wait(10000)

    cy.task('get-confirm-code').then(code => {
      cy.get('[data-testid="confirmationCode"]').type(code)
      cy.get('[data-testid="confirmSigning"]').click()

      cy.wait(3000)

      cy.get('[data-testid="txnSignedMsg"]').should('be.visible')
    })
  })
})