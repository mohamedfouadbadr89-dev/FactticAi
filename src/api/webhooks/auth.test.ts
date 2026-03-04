import { POST } from './auth';
import { supabaseServer } from '../../../lib/supabaseServer';

// Mock the Next.js Request object and Supabase server client
jest.mock('../../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null })
  }
}));

describe('SSO Auth Webhook Interceptor', () => {
  const mockWebhookSecret = 'test-secret-123';
  let mockSupabaseClient: any;

  beforeAll(() => {
    process.env.SUPABASE_AUTH_WEBHOOK_SECRET = mockWebhookSecret;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = supabaseServer;
    mockSupabaseClient.from.mockClear();
    mockSupabaseClient.upsert.mockClear();
  });

  it('rejects requests with invalid signatures', async () => {
    const req = new Request('https://api.facttic.ai/webhooks/auth', {
      method: 'POST',
      headers: {
        'x-supabase-webhook-secret': 'wrong-secret'
      },
      body: JSON.stringify({ record: { id: '123' } })
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  it('maps Azure AD / Okta claims to Facttic `admin` profiles successfully', async () => {
    const req = new Request('https://api.facttic.ai/webhooks/auth', {
      method: 'POST',
      headers: {
        'x-supabase-webhook-secret': mockWebhookSecret
      },
      body: JSON.stringify({
        type: 'INSERT',
        record: {
          id: 'user-789',
          email: 'ceo@stark.com',
          app_metadata: { provider: 'saml', sso_org_id: 'org-123' },
          user_metadata: { groups: ['Facttic_Admins', 'Engineering'] }
        }
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    // Verify Upsert arguments
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-789',
        org_id: 'org-123',
        role: 'admin',
        email: 'ceo@stark.com'
      }),
      expect.any(Object)
    );
  });

  it('falls back to `member` role if no mapped external groups match', async () => {
    const req = new Request('https://api.facttic.ai/webhooks/auth', {
      method: 'POST',
      headers: {
        'x-supabase-webhook-secret': mockWebhookSecret
      },
      body: JSON.stringify({
        type: 'INSERT',
        record: {
          id: 'user-999',
          email: 'intern@stark.com',
          app_metadata: { providers: ['sso'] },
          user_metadata: { organization_id: 'org-123', groups: ['All_Company'] }
        }
      })
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'analyst'
      }),
      expect.any(Object)
    );
  });
});
