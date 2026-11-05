const products = [
  {
    id: 1,
    slug: 'tela-tapiceria-lino',
    name: 'Tela de tapicería lino',
    description: 'Tela para tapicería vendida por metro.',
    price: '18900.00',
    stock: 5,
    unit_type: 'metro',
    width_cm: 250,
    material: 'Poliéster',
    color: 'Natural',
    image_url: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    category: { name: 'Tapicería', slug: 'tapiceria' },
  },
]

const categories = [
  {
    id: 1,
    name: 'Tapicería',
    slug: 'tapiceria',
    description: 'Telas para tapicería.',
    products_count: products.length,
  },
]

describe('Visita de la tienda', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/api/v1/categories', categories)
    cy.intercept('GET', '**/api/v1/products', {
      data: products,
      current_page: 1,
      last_page: 1,
      total: products.length,
    })
    cy.intercept('GET', '**/api/v1/products/tela-tapiceria-lino', products[0])
    cy.intercept('GET', '**/api/v1/cart?*', { items: [] }).as('loadCart')
  })

  it('muestra la página principal con categorías y productos', () => {
    cy.visit('/')
    cy.wait('@loadCart')

    cy.contains('h1', 'Diseña tu hogar con luz y estilo.').should('be.visible')
    cy.contains('h2', 'Categorías').should('be.visible')
    cy.contains('.category-card', 'Tapicería').should('be.visible')
    cy.contains('h2', 'Productos destacados').should('be.visible')
    cy.contains('.product-card', 'Tela de tapicería lino')
      .should('be.visible')
      .and('contain', 'Ancho del rollo: 2,50 m')
      .and('contain', 'por metro')
  })

  it('navega desde la página principal a una categoría', () => {
    cy.intercept('GET', '**/api/v1/categories/tapiceria/products', {
      category: categories[0],
      products,
    })

    cy.visit('/')
    cy.wait('@loadCart')
    cy.contains('.category-card', 'Tapicería').click()

    cy.location('pathname').should('eq', '/categories/tapiceria')
    cy.contains('h1', 'Tapicería').should('be.visible')
    cy.contains('.product-card', 'Tela de tapicería lino')
      .should('be.visible')
      .and('contain', '2,50 m')
  })

  it('muestra la unidad y el ancho en el detalle del producto', () => {
    cy.visit('/products/tela-tapiceria-lino')

    cy.contains('h1', 'Tela de tapicería lino').should('be.visible')
    cy.contains('.detail-price', 'por metro').should('be.visible')
    cy.contains('.specifications', 'Ancho del rollo')
      .should('contain', '2,50 m')
  })

  it('permite añadir un producto y verlo en el carrito', () => {
    cy.intercept('PUT', '**/api/v1/cart', (request) => {
      const { items } = request.body
      request.reply({
        items: items.map(({ slug, quantity }) => ({
          ...products.find((product) => product.slug === slug),
          quantity,
        })),
      })
    }).as('saveCart')

    cy.visit('/')
    cy.wait('@loadCart')
    cy.contains('.product-card', 'Tela de tapicería lino')
      .contains('button', 'Añadir')
      .click()

    cy.wait('@saveCart')
    cy.contains('.cart-link', 'Carrito (1)').click()

    cy.location('pathname').should('eq', '/cart')
    cy.contains('h1', 'Tu carrito').should('be.visible')
    cy.contains('.cart-item', 'Tela de tapicería lino')
      .should('be.visible')
      .and('contain', 'Ancho del rollo: 2,50 m')
      .and('contain', '1 metro')
  })
})
