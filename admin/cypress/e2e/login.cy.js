describe('Inicio de sesión del administrador', () => {
  it('muestra la página de acceso', () => {
    cy.visit('/')
    cy.contains('h1', 'Control claro.').should('be.visible')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.contains('button', 'Ingresar al inventario').should('be.visible')
  })

  it('rechaza credenciales incorrectas y muestra el error del servidor', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
        statusCode: 422,
        body: {
          message: 'Los datos proporcionados no son válidos.',
          errors: { email: ['Credenciales inválidas.'] },
        },
    }).as('login')
    cy.visit('/')

    cy.get('#email').type('test@example.com')
    cy.get('#password').type('incorrecta')
    cy.contains('button', 'Ingresar al inventario').click()

    cy.wait('@login').its('response.statusCode').should('eq', 422)
    cy.contains('.form-error', 'Credenciales inválidas.').should('be.visible')
    cy.contains('h1', 'Control claro.').should('be.visible')
  })

  it('no envía el formulario cuando faltan los campos requeridos', () => {
    let loginAttempts = 0
    cy.intercept('POST', '**/api/v1/auth/login', () => {
      loginAttempts += 1
    }).as('login')
    cy.visit('/')

    cy.contains('button', 'Ingresar al inventario').click()
    cy.get('#email').should(($input) => {
      expect($input[0].checkValidity()).to.be.false
    })
    cy.get('#password').should(($input) => {
      expect($input[0].checkValidity()).to.be.false
    })
    cy.then(() => expect(loginAttempts).to.equal(0))
  })

  it('permite ingresar con credenciales correctas', () => {
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: {
        token: 'cypress-test-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' },
      },
    }).as('login')
    cy.intercept('GET', '**/api/v1/categories', [])
    cy.intercept('GET', '**/api/v1/admin/categories', [])
    cy.intercept('GET', '**/api/v1/admin/products**', {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    })
    cy.visit('/')

    cy.get('#email').type('test@example.com')
    cy.get('#password').type('password')
    cy.contains('button', 'Ingresar al inventario').click()
    cy.wait('@login').its('response.statusCode').should('eq', 200)
    cy.contains('h1', 'Inventario.').should('be.visible')
  })
})