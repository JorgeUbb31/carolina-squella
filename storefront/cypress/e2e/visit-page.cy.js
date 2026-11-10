describe('Visita de la tienda', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/categories', [])
    cy.intercept('GET', '**/api/v1/products', {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    })
    cy.intercept('GET', '**/api/v1/cart?*', { items: [] }).as('loadCart')
  })

  it('abre la página principal de la tienda', () => {
    cy.visit('/')
    cy.wait('@loadCart')

    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Diseña tu hogar con luz y estilo.').should('be.visible')
  })
})
