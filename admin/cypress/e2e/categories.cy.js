const initialCategories = [
  { id: 1, name: 'Cortinas', slug: 'cortinas', description: 'Cortinas para el hogar.', is_active: true, products_count: 2 },
]

describe('Administración de categorías', () => {
  let categories

  beforeEach(() => {
    categories = initialCategories.map((category) => ({ ...category }))

    cy.intercept('GET', '**/api/v1/categories', (request) => {
      request.reply(categories)
    })
    cy.intercept('GET', '**/api/v1/admin/categories', (request) => {
      request.reply(categories)
    }).as('loadCategories')
    cy.intercept('GET', '**/api/v1/admin/products*', {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    })

    cy.loginAsAdmin()
    cy.wait('@loadCategories')
    cy.contains('button', 'Categorías').click()
    cy.contains('h1', 'Categorías.').should('be.visible')
  })

  it('muestra las categorías registradas', () => {
    cy.contains('tr', 'Cortinas')
      .should('contain', '/cortinas')
      .and('contain', 'Cortinas para el hogar.')
      .and('contain', '2')
  })

  it('crea una categoría nueva', () => {
    cy.intercept('POST', '**/api/v1/admin/categories', (request) => {
      categories.push({
        ...request.body,
        id: 2,
        products_count: 0,
      })
      request.reply({ statusCode: 201, body: { data: request.body } })
    }).as('createCategory')

    cy.contains('button', 'Nueva categoría').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Nombre').find('input').type('Blackout Premium')
      cy.contains('label', 'Descripción').find('textarea').type('Telas opacas para dormitorio.')
      cy.contains('button', 'Crear categoría').click()
    })

    cy.wait('@createCategory').its('request.body').should('deep.include', {
      name: 'Blackout Premium',
      slug: 'blackout-premium',
      description: 'Telas opacas para dormitorio.',
      is_active: true,
    })
    cy.wait('@loadCategories')
    cy.contains('tr', 'Blackout Premium').should('be.visible')
    cy.contains('.inline-success', 'Categoría creada correctamente.').should('be.visible')
  })

  it('edita una categoría existente', () => {
    cy.intercept('PUT', '**/api/v1/admin/categories/1', (request) => {
      categories = categories.map((category) => (
        category.id === 1 ? { ...category, ...request.body } : category
      ))
      request.reply({ statusCode: 200, body: { data: request.body } })
    }).as('updateCategory')

    cy.get('[aria-label="Editar Cortinas"]').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Nombre').find('input').clear().type('Cortinas Premium')
      cy.contains('button', 'Guardar cambios').click()
    })

    cy.wait('@updateCategory').its('request.body.slug').should('eq', 'cortinas-premium')
    cy.wait('@loadCategories')
    cy.contains('tr', 'Cortinas Premium').should('be.visible')
    cy.contains('.inline-success', 'Categoría actualizada.').should('be.visible')
  })

  it('cancela el borrado de una categoría sin llamar a la API', () => {
    cy.intercept('DELETE', '**/api/v1/admin/categories/1').as('deleteCategory')

    cy.get('[aria-label="Eliminar Cortinas"]').click()
    cy.get('[role="dialog"]').contains('button', 'Cancelar').click()

    cy.contains('tr', 'Cortinas').should('be.visible')
    cy.get('@deleteCategory.all').should('have.length', 0)
  })

  it('elimina una categoría al confirmar', () => {
    cy.intercept('DELETE', '**/api/v1/admin/categories/1', (request) => {
      categories = categories.filter((category) => category.id !== 1)
      request.reply({ statusCode: 204 })
    }).as('deleteCategory')

    cy.get('[aria-label="Eliminar Cortinas"]').click()
    cy.get('[role="dialog"]').contains('button', 'Eliminar').click()

    cy.wait('@deleteCategory')
    cy.wait('@loadCategories')
    cy.contains('No hay categorías').should('be.visible')
    cy.contains('.inline-success', 'Categoría eliminada.').should('be.visible')
  })
})