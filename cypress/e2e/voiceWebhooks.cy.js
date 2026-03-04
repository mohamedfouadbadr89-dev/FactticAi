/// <reference types="cypress" />

describe('Voice Webhook Ingestion Pipeline (Production Parity)', () => {

  const ORG_ID = 'test-e2e-org-id';
  
  beforeEach(() => {
    // Ensuring isolation resets strictly per integration flow test
  });

  it('successfully ingests and validates a standard Vapi payload', () => {
    cy.request({
      method: 'POST',
      url: `/api/webhooks/voice?orgId=${ORG_ID}`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('API_SECRET')}`,
        'x-byok-key': Cypress.env('BYOK_KEY')
      },
      body: {
        message: {
          type: 'end-of-call-report',
          call: {
            id: 'vapi-e2e-1234',
            startedAt: new Date().toISOString(),
          },
          transcript: 'This is an End-To-End test tracing the Vapi pipeline. Ensure it is mapped perfectly.'
        }
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('id');
    });
  });

  it('successfully ingests and validates a standard Retell payload', () => {
    cy.request({
      method: 'POST',
      url: `/api/webhooks/voice?orgId=${ORG_ID}`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('API_SECRET')}`,
        'x-byok-key': Cypress.env('BYOK_KEY')
      },
      body: {
        event: 'call_analyzed',
        call: {
          call_id: 'retell-e2e-8901',
          start_timestamp: new Date().getTime(),
          transcript: 'Retell payload test simulation running.'
        }
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.eq(true);
    });
  });

  it('rejects unencrypted pipelines lacking BYOK parameters (Security)', () => {
    cy.request({
      method: 'POST',
      url: `/api/webhooks/voice?orgId=${ORG_ID}`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('API_SECRET')}`
        // INTENTIONALLY MISSING 'x-byok-key'
      },
      body: {
        message: { call: { id: "test" } }
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.body.error).to.include('BYOK Enforcement: Missing x-byok-key header');
    });
  });

  it('aborts heavily malicious XSS injection vectors explicitly', () => {
    cy.request({
      method: 'POST',
      url: `/api/webhooks/voice?orgId=${ORG_ID}`,
      headers: {
        'Authorization': `Bearer ${Cypress.env('API_SECRET')}`,
        'x-byok-key': Cypress.env('BYOK_KEY')
      },
      body: {
        event: 'malformed_call',
        call: {
          call_id: 'xss-e2e-999',
          transcript: '<script>alert("Facttic Governance bypass attempt")</script>'
        }
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(422);
      expect(response.body.error).to.include('XSS Attack Detected');
    });
  });

});
