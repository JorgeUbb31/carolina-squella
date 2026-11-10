// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('loginAsAdmin', () => {
	cy.intercept('POST', '**/api/v1/auth/login', {
		statusCode: 200,
		body: {
			token: 'cypress-test-token',
			user: { id: 1, name: 'Test User', email: 'test@example.com' },
		},
	}).as('adminLogin')

	cy.visit('/')
	cy.get('#email').type('test@example.com')
	cy.get('#password').type('password')
	cy.contains('button', 'Ingresar al inventario').click()
	cy.wait('@adminLogin').its('response.statusCode').should('eq', 200)
	cy.contains('h1', 'Inventario.').should('be.visible')
})