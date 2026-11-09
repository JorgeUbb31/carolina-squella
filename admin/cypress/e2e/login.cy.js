describe('Inicio de sesión del administrador', () => {
  it('muestra la página de acceso', () => {
    cy.visit('/')
    cy.contains('h1', 'Control claro.').should('be.visible')
    cy.get('#email').should('be.visible')
    cy.get('#password').should('be.visible')
    cy.contains('button', 'Ingresar al inventario').should('be.visible')
  })

  it('rechaza credenciales incorrectas, bloquea el envío vacío y permite el acceso', () => {
    let loginAttempts = 0
    cy.intercept('POST', '**/api/v1/auth/login', (request) => {
      loginAttempts += 1
      const { email, password } = request.body

      if (email === 'test@example.com' && password === 'password') {
        request.reply({
          statusCode: 200,
          body: {
            token: 'cypress-test-token',
            user: { id: 1, name: 'Test User', email },
          },
        })
        return
      }

      request.reply({
        statusCode: 422,
        body: {
          message: 'Los datos proporcionados no son válidos.',
          errors: { email: ['Credenciales inválidas.'] },
        },
      })
    }).as('login')
    cy.intercept('GET', '**/api/v1/categories', [])
    cy.intercept('GET', '**/api/v1/admin/products**', {
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
    })
    cy.visit('/')

    cy.get('#email').type('test@example.com')
    cy.get('#password').type('incorrecta')
    cy.contains('button', 'Ingresar al inventario').click()
    cy.wait('@login').its('response.statusCode').should('eq', 422)
    cy.contains('.form-error', 'Credenciales inválidas.').should('be.visible')

    cy.get('#email').clear()
    cy.get('#password').clear()
    cy.contains('button', 'Ingresar al inventario').click()
    cy.get('#email').should(($input) => {
      expect($input[0].checkValidity()).to.be.false
    })
    cy.then(() => expect(loginAttempts).to.equal(1))

    cy.get('#email').type('test@example.com')
    cy.get('#password').type('password')
    cy.contains('button', 'Ingresar al inventario').click()
    cy.wait('@login').its('response.statusCode').should('eq', 200)
    cy.then(() => expect(loginAttempts).to.equal(2))
    cy.contains('h1', 'Inventario.').should('be.visible')
  })
})