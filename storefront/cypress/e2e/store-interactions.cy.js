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
  {
    id: 2,
    slug: 'cortina-blackout',
    name: 'Cortina blackout',
    description: 'Cortina opaca para dormitorio.',
    price: '9900.00',
    stock: 8,
    unit_type: 'pieza',
    material: 'Poliéster',
    color: 'Gris',
    image_url: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
    category: { name: 'Cortinas', slug: 'cortinas' },
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
  {
    id: 2,
    name: 'Cortinas',
    slug: 'cortinas',
    description: 'Cortinas para cada espacio.',
    products_count: 1,
  },
]

describe('Interacciones de la tienda', () => {
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

  describe('Catálogo', () => {
    it('filtra y ordena la colección completa', () => {
      cy.intercept('GET', '**/api/v1/products?page=*', (request) => {
        const page = new URL(request.url).searchParams.get('page')
        if (page === '1') {
          request.reply({ data: [products[0]], current_page: 1, last_page: 2, total: 2 })
        } else {
          request.reply({ data: [products[1]], current_page: 2, last_page: 2, total: 2 })
        }
      }).as('catalogProducts')

      cy.visit('/')
      cy.wait('@loadCart')
      cy.contains('a', 'Ver colección').click()

      cy.location('pathname').should('eq', '/products')
      cy.contains('h1', 'Todos los productos').should('be.visible')
      cy.get('.product-card').should('have.length', 2)
      cy.get('.product-card h2').first().should('contain', 'Tela de tapicería lino')

      cy.get('select[name="sortOrder"]').select('price-asc')
      cy.get('.product-card h2').first().should('contain', 'Cortina blackout')
      cy.get('select[name="categorySlug"]').select('tapiceria')
      cy.get('.product-card').should('have.length', 1)
      cy.contains('.product-card', 'Tela de tapicería lino').should('be.visible')
      cy.get('input[name="search"]').type('sin coincidencias')
      cy.contains('No encontramos productos con esos filtros.').should('be.visible')
    })

    it('abre una categoría y muestra sus productos', () => {
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

    it('muestra unidad y ancho en el detalle de producto', () => {
      cy.visit('/products/tela-tapiceria-lino')

      cy.contains('h1', 'Tela de tapicería lino').should('be.visible')
      cy.contains('.detail-price', 'por metro').should('be.visible')
      cy.contains('.specifications', 'Ancho del rollo')
        .should('contain', '2,50 m')
    })
  })

  describe('Cotizaciones', () => {
    it('envía una solicitud de cotización desde la portada', () => {
      cy.intercept('POST', '**/api/v1/quote-requests', {
        statusCode: 201,
        body: {
          message: 'Recibimos tu solicitud y enviamos una confirmación a tu correo.',
          email_sent: true,
        },
      }).as('submitQuote')

      cy.visit('/')
      cy.wait('@loadCart')
      cy.contains('button', 'Solicitar cotización').click()
      cy.get('#solicitar-cotizacion').should('be.visible')
      cy.get('input[name="name"]').type('Jorge Díaz')
      cy.get('input[name="email"]').type('jorge@example.com')
      cy.get('input[name="phone"]').type('+56912345678')
      cy.get('textarea[name="details"]').type('Necesito cotizar cortinas para dos ventanas.')
      cy.contains('button', 'Enviar solicitud').click()

      cy.wait('@submitQuote').its('request.body').should('deep.equal', {
        name: 'Jorge Díaz',
        email: 'jorge@example.com',
        phone: '+56912345678',
        details: 'Necesito cotizar cortinas para dos ventanas.',
      })
      cy.contains('Recibimos tu solicitud y enviamos una confirmación a tu correo.').should('be.visible')
    })
  })

  describe('Carrito y compra', () => {
    beforeEach(() => {
      cy.intercept('PUT', '**/api/v1/cart', (request) => {
        const { items } = request.body
        request.reply({
          items: items.map(({ slug, quantity }) => ({
            ...products.find((product) => product.slug === slug),
            quantity,
          })),
        })
      }).as('saveCart')
      cy.intercept('DELETE', '**/api/v1/cart?*', { items: [] }).as('clearCart')
    })

    function addProductToCart() {
      cy.visit('/')
      cy.wait('@loadCart')
      cy.contains('.product-card', 'Tela de tapicería lino')
        .contains('button', 'Añadir')
        .click()
      cy.wait('@saveCart')
      cy.contains('.cart-link', 'Carrito (1)').click()
      cy.location('pathname').should('eq', '/cart')
    }

    it('añade un producto y lo muestra en el carrito', () => {
      addProductToCart()

      cy.contains('h1', 'Tu carrito').should('be.visible')
      cy.contains('.cart-item', 'Tela de tapicería lino')
        .should('be.visible')
        .and('contain', 'Ancho del rollo: 2,50 m')
        .and('contain', '1 metro')
    })

    it('actualiza la cantidad y permite eliminar el producto', () => {
      addProductToCart()

      cy.get('[aria-label="Aumentar cantidad de Tela de tapicería lino"]').click()
      cy.wait('@saveCart').its('request.body.items[0].quantity').should('eq', 2)
      cy.contains('.cart-item', '2 metros').should('be.visible')

      cy.get('[aria-label="Disminuir cantidad de Tela de tapicería lino"]').click()
      cy.wait('@saveCart').its('request.body.items[0].quantity').should('eq', 1)
      cy.contains('.cart-item', '1 metro').should('be.visible')

      cy.contains('.cart-item', 'Tela de tapicería lino').contains('button', 'Eliminar').click()
      cy.contains('Tu carrito está vacío.').should('be.visible')
    })

    it('valida regiones y actualiza las comunas disponibles', () => {
      addProductToCart()
      cy.contains('button', 'Continuar con la compra').click()

      cy.contains('h2', 'Datos de entrega').should('be.visible')
      cy.contains('Transferencia bancaria').should('be.visible')
      cy.get('select[name="delivery_region"]').find('option').should('have.length', 17)
      cy.get('select[name="delivery_city"]').should('be.disabled')

      cy.get('select[name="delivery_region"]').select('Región de Valparaíso')
      cy.get('select[name="delivery_city"]')
        .should('not.be.disabled')
        .find('option')
        .should('have.length', 39)
      cy.get('select[name="delivery_city"]').select('Viña del Mar')

      cy.get('select[name="delivery_region"]').select('Región Metropolitana de Santiago')
      cy.get('select[name="delivery_city"]')
        .should('have.value', '')
        .find('option')
        .should('have.length', 53)
        .and('contain', 'Santiago')
        .and('not.contain', 'Viña del Mar')
    })

    it('registra una compra por transferencia y muestra la confirmación', () => {
      cy.intercept('POST', '**/api/v1/orders', {
        statusCode: 201,
        body: { order: { order_number: 'CS-2026-001' } },
      }).as('submitOrder')

      addProductToCart()
      cy.contains('button', 'Continuar con la compra').click()
      cy.contains('label', 'Nombre completo').find('input').type('Jorge Díaz')
      cy.contains('label', 'Correo electrónico').find('input').type('jorge@example.com')
      cy.contains('label', 'Teléfono').find('input').type('+56912345678')
      cy.contains('label', 'Dirección').find('input').type('Av. Providencia 123')
      cy.get('select[name="delivery_region"]').select('Región Metropolitana de Santiago')
      cy.get('select[name="delivery_city"]').select('Santiago')
      cy.contains('button', 'Confirmar pedido').click()

      cy.get('[role="alertdialog"]').should('be.visible')
      cy.contains('button', 'Entiendo, continuar').click()
      cy.wait('@submitOrder').its('request.body').should((body) => {
        expect(body.customer_name).to.equal('Jorge Díaz')
        expect(body.customer_email).to.equal('jorge@example.com')
        expect(body.payment_method).to.equal('bank_transfer')
        expect(body.delivery_city).to.equal('Santiago')
        expect(body.cart_token).to.be.a('string').and.not.be.empty
      })
      cy.wait('@clearCart')
      cy.contains('h2', 'Gracias por tu compra').should('be.visible')
      cy.contains('CS-2026-001').should('be.visible')
    })
  })
})