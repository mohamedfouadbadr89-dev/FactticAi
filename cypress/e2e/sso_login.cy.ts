/// <reference types="cypress" />

describe('Enterprise Single Sign-On (SSO) Flow', () => {
  beforeEach(() => {
    // Reset state before each test
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/login');
  });

  it('renders the standard split-login view correctly', () => {
    cy.contains('Sign in to Facttic').should('be.visible');
    
    // Check standard Email/Password forms
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    
    // Check SSO separation
    cy.contains('OR').should('be.visible');
    cy.contains('Enterprise Login (SSO)').should('be.visible');
  });

  it('handles invalid enterprise domains with appropriate error boundaries', () => {
    // Attempt empty submission
    cy.contains('button', 'Enterprise Login (SSO)').click();
    // HTML5 validation should intercept required domains
    cy.get('input#sso-domain').invoke('prop', 'validationMessage').should('not.be.empty');

    // Type arbitrary non-whitelisted domain
    cy.get('input#sso-domain').type('unregistered-domain.com');
    cy.contains('button', 'Enterprise Login (SSO)').click();

    // Mock the backend API rejection
    cy.intercept('POST', '/api/auth/sso', {
      statusCode: 400,
      body: { error: 'Domain is not registered for SSO.' }
    }).as('ssoInit');

    cy.wait('@ssoInit');
    
    // Wait for mock error toast/alert to appear in the DOM
    // Assuming you have a toast library or native error handling state on the Page
    cy.contains('Domain is not registered for SSO').should('exist');
  });

  it('successfully redirects to Identity Provider for recognized domains', () => {
    const mockDomain = 'stark.com';
    const mockRedirectUrl = 'https://dev-xxxx.okta.com/app/xxxx/sso/saml';

    cy.intercept('POST', '/api/auth/sso', {
      statusCode: 200,
      body: { url: mockRedirectUrl }
    }).as('ssoInitSuccess');

    // Prevent Cypress from actually executing the cross-origin OKTA redirect navigating away from the test suite
    cy.on('window:before:load', (win) => {
      cy.stub(win, 'location').value({ href: mockRedirectUrl });
    });

    cy.get('input#sso-domain').type(mockDomain);
    
    cy.contains('button', 'Enterprise Login (SSO)').should('not.be.disabled').click();
    
    // The button transitions to loading state
    cy.contains('button', 'Redirecting to IdP...').should('exist');

    cy.wait('@ssoInitSuccess').then((interception) => {
       expect(interception.request.body).to.deep.equal({ domain: mockDomain });
       expect(interception.response?.body.url).to.equal(mockRedirectUrl);
       // We can assert the redirect pattern was attempted natively here
    });
  });
});
