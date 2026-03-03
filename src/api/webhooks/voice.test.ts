import { POST, normalizePayload } from './voice';
import { supabaseServer } from '@/lib/supabaseServer';

// Mock the environment variable for testing
process.env.VOICE_WEBHOOK_SECRET = 'test-secret-123';

// Mock Supabase Server client
jest.mock('@/lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn(),
  },
}));

describe('Voice Webhook API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (payload: any, headers: Record<string, string> = {}) => {
    return new Request('https://api.facttic.com/api/webhooks/voice', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        ...headers,
      }),
      body: JSON.stringify(payload),
    });
  };

  describe('normalizePayload', () => {
    it('should normalize a Vapi payload correctly', () => {
      const vapiPayload = {
        message: {
          call: {
            id: 'vapi-call-123',
            status: 'ended',
            startedAt: '2026-03-03T21:30:00.000Z',
            endedAt: '2026-03-03T21:35:00.000Z',
          },
          transcript: 'Hello from Vapi',
          recordingUrl: 'https://vapi.ai/recording/123.wav',
        },
      };

      const result = normalizePayload(vapiPayload, 'org-uuid-123');

      expect(result.orgId).toBe('org-uuid-123');
      expect(result.externalId).toBe('vapi-call-123');
      expect(result.provider).toBe('vapi');
      expect(result.metadata.message.call.status).toBe('ended');
      expect(result.transcript).toBe('Hello from Vapi');
      expect(result.audio).toBe('https://vapi.ai/recording/123.wav');
    });

    it('should normalize a Retell payload correctly', () => {
      const retellPayload = {
        event: 'call_ended',
        call: {
          call_id: 'retell-call-456',
          start_timestamp: 1709491800000,
          end_timestamp: 1709492100000,
          transcript: 'Hello from Retell',
          recording_url: 'https://retellai.com/recording/456.wav',
        },
      };

      const result = normalizePayload(retellPayload, 'org-uuid-456');

      expect(result.orgId).toBe('org-uuid-456');
      expect(result.externalId).toBe('retell-call-456');
      expect(result.provider).toBe('retell');
      expect(result.metadata.event).toBe('call_ended');
      expect(result.transcript).toBe('Hello from Retell');
      expect(result.audio).toBe('https://retellai.com/recording/456.wav');
    });

    it('should throw an error if call identifier is missing', () => {
      const invalidPayload = { something_else: 'no id here' };
      expect(() => normalizePayload(invalidPayload, 'org-123')).toThrow('Unsupported payload format: missing call identifier');
    });
  });

  describe('POST Handler', () => {
    it('should return 401 if unauthorized (missing token)', async () => {
      const req = createMockRequest({ id: '123' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 if unauthorized (wrong token)', async () => {
      const req = createMockRequest({ id: '123' }, { authorization: 'Bearer WRONG-TOKEN' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if payload is not valid JSON', async () => {
      const req = new Request('https://api.facttic.com/api/webhooks/voice?orgId=123e4567-e89b-12d3-a456-426614174000', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'authorization': 'Bearer test-secret-123'
        }),
        body: 'invalid-json',
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON payload');
    });
    
    it('should return 400 if orgId is missing', async () => {
      // Creating a request without orgId query param and x-org-id header
      const req = createMockRequest({ id: '123' }, { authorization: 'Bearer test-secret-123' });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing organization ID context');
    });

    it('should return 422 if data fails normalization or validation', async () => {
      const req = new Request('https://api.facttic.com/api/webhooks/voice?orgId=123e4567-e89b-12d3-a456-426614174000', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'authorization': 'Bearer test-secret-123'
        }),
        body: JSON.stringify({ invalid: 'data' }),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.error).toContain('Validation failed');
    });

    it('should process and store valid voice conversation successfully and extract orgId from query params', async () => {
      (supabaseServer.insert as jest.Mock).mockResolvedValue({ error: null });

      const vapiPayload = {
        message: {
          call: { id: 'vapi-123', status: 'completed' },
          transcript: 'Success test transcript',
        },
      };

      const req = new Request('https://api.facttic.com/api/webhooks/voice?orgId=123e4567-e89b-12d3-a456-426614174000', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'authorization': 'Bearer test-secret-123'
        }),
        body: JSON.stringify(vapiPayload),
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(supabaseServer.from).toHaveBeenCalledWith('voice_conversations');
      expect(supabaseServer.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: '123e4567-e89b-12d3-a456-426614174000',
          provider_call_id: 'vapi-123',
          provider: 'vapi',
          transcript: 'Success test transcript',
        })
      );
    });
    
    it('should successfully extract orgId from headers', async () => {
      (supabaseServer.insert as jest.Mock).mockResolvedValue({ error: null });

      const vapiPayload = {
        message: { call: { id: 'vapi-456' } },
      };

      const req = createMockRequest(vapiPayload, { 
        authorization: 'Bearer test-secret-123',
        'x-org-id': '987e6543-e21b-12d3-a456-426614174000'
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(supabaseServer.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: '987e6543-e21b-12d3-a456-426614174000',
          provider_call_id: 'vapi-456',
        })
      );
    });

    it('should return 500 if database insert fails', async () => {
      (supabaseServer.insert as jest.Mock).mockResolvedValue({ error: { message: 'DB Error' } });

      const vapiPayload = {
        message: { call: { id: 'vapi-error-123' } },
      };

      const req = createMockRequest(vapiPayload, { 
        authorization: 'Bearer test-secret-123',
        'x-org-id': '00000000-0000-0000-0000-000000000000'
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to store conversation data');
    });
  });
});
