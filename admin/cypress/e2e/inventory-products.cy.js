const categories = [
  { id: 1, name: 'Cortinas', slug: 'cortinas', description: 'Cortinas para el hogar.', is_active: true, products_count: 2 },
  { id: 2, name: 'Tapicería', slug: 'tapiceria', description: 'Telas de tapicería.', is_active: true, products_count: 0 },
]

const initialProducts = [
  {
    id: 1,
    slug: 'cortina-de-lino',
    name: 'Cortina de lino',
    category_id: 1,
    category: categories[0],
    price: '25000.00',
    stock: 4,
    unit_type: 'pieza',
    material: 'Lino',
    color: 'Crudo',
    is_active: true,
  },
  {
    id: 2,
    slug: 'blackout-premium',
    name: 'Blackout premium',
    category_id: 1,
    category: categories[0],
    price: '32000.00',
    stock: 12,
    unit_type: 'pieza',
    material: 'Poliéster',
    color: 'Gris',
    is_active: true,
  },
]

describe('Inventario de productos', () => {
  let products

  beforeEach(() => {
    products = initialProducts.map((product) => ({ ...product }))

    cy.intercept('GET', '**/api/v1/categories', categories)
    cy.intercept('GET', '**/api/v1/admin/categories', categories)
    cy.intercept('GET', '**/api/v1/admin/products*', (request) => {
      const search = new URL(request.url).searchParams.get('search')?.toLowerCase()
      const categoryId = new URL(request.url).searchParams.get('category_id')
      const lowStock = new URL(request.url).searchParams.has('low_stock_below')
      const filtered = products.filter((product) => (
        (!search || product.name.toLowerCase().includes(search))
        && (!categoryId || String(product.category_id) === categoryId)
        && (!lowStock || product.stock <= 5)
      ))

      request.reply({
        data: filtered,
        current_page: 1,
        last_page: 1,
        total: filtered.length,
      })
    }).as('loadProducts')

    cy.loginAsAdmin()
    cy.wait('@loadProducts')
  })

  it('muestra productos con categoría, precio y stock', () => {
    cy.contains('tr', 'Cortina de lino')
      .should('contain', 'Cortinas')
      .and('contain', 'Lino')
      .and('contain', '4')
    cy.contains('tr', 'Blackout premium').should('be.visible')
  })

  it('busca productos por nombre', () => {
    cy.get('input[placeholder="Buscar por nombre…"]').type('blackout')
    cy.get('@loadProducts.all').should((requests) => {
      expect(requests.at(-1).request.url).to.include('search=blackout')
    })

    cy.contains('tr', 'Blackout premium').should('be.visible')
    cy.contains('tr', 'Cortina de lino').should('not.exist')
  })

  it('filtra por categoría y por stock bajo', () => {
    cy.get('.category-control select').select('2')
    cy.wait('@loadProducts').its('request.url').should('include', 'category_id=2')
    cy.contains('No encontramos productos').should('be.visible')

    cy.get('.category-control select').select('')
    cy.wait('@loadProducts')
    cy.contains('button', 'Stock bajo').click()
    cy.wait('@loadProducts').its('request.url').should('include', 'low_stock_below=')
    cy.contains('tr', 'Cortina de lino').should('be.visible')
    cy.contains('tr', 'Blackout premium').should('not.exist')
  })

  it('crea un producto y actualiza la lista', () => {
    cy.intercept('POST', '**/api/v1/admin/products', (request) => {
      products.push({
        ...request.body,
        id: 3,
        category: null,
      })
      request.reply({ statusCode: 201, body: { data: request.body } })
    }).as('createProduct')

    cy.contains('button', 'Nuevo producto').click()
    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Nombre').find('input').type('Manta tejida')
      cy.contains('label', 'Precio (CLP)').find('input').type('18000')
      cy.contains('label', 'Stock disponible').find('input').type('6')
      cy.contains('button', 'Crear producto').click()
    })

    cy.wait('@createProduct').its('request.body').should((body) => {
      expect(body.name).to.equal('Manta tejida')
      expect(body.slug).to.equal('manta-tejida')
      expect(body.price).to.equal(18000)
      expect(body.stock).to.equal(6)
    })
    cy.wait('@loadProducts')
    cy.contains('tr', 'Manta tejida').should('be.visible')
    cy.contains('.inline-success', 'Producto creado correctamente.').should('be.visible')
  })

  it('elimina un producto después de confirmar', () => {
    cy.intercept('DELETE', '**/api/v1/admin/products/1', (request) => {
      products = products.filter((product) => product.id !== 1)
      request.reply({ statusCode: 204 })
    }).as('deleteProduct')

    cy.contains('tr', 'Cortina de lino').within(() => {
      cy.get('[aria-label="Eliminar Cortina de lino"]').click()
    })
    cy.get('[role="dialog"]').should('contain', '¿Eliminar “Cortina de lino”?')
    cy.get('[role="dialog"]').contains('button', 'Eliminar').click()

    cy.wait('@deleteProduct')
    cy.wait('@loadProducts')
    cy.contains('tr', 'Cortina de lino').should('not.exist')
    cy.contains('.inline-success', 'Producto eliminado.').should('be.visible')
  })
})