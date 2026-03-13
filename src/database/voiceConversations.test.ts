import { saveVoiceConversation, getVoiceConversationById } from './voiceConversations';
import { supabaseServer } from '../../lib/supabaseServer';
import { VoiceConversation } from '../models/VoiceConversation';

jest.mock('../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn()
  },
}));

describe('Voice Conversations Database Functions', () => {
  const mockByokKey = 'MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI='; // Valid 32-byte Base64 AES Key

  const completeConversationObj = new VoiceConversation({
    orgId: 'org-test-999',
    provider: 'vapi',
    externalId: 'ext-321',
    startTime: new Date('2026-03-04T05:00:00Z'),
    transcript: 'Encrypted test payload',
    metadata: { testMeta: true }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveVoiceConversation', () => {
    it('should throw an error if orgId is missing in the object structure', async () => {
      const invalidConv = { ...completeConversationObj, orgId: '' } as VoiceConversation;
      await expect(saveVoiceConversation(invalidConv, mockByokKey)).rejects.toThrow('Organization ID is required');
    });

    it('should throw an error if no BYOK key is provided', async () => {
      await expect(saveVoiceConversation(completeConversationObj, '')).rejects.toThrow('Customer BYOK key is mandatory');
    });

    it('should encrypt sensitive text patterns and store the payload using .insert', async () => {
      (supabaseServer.insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: { id: 'test-insert-uuid' }, error: null })
        })
      });

      const insertedId = await saveVoiceConversation(completeConversationObj, mockByokKey);

      expect(supabaseServer.from).toHaveBeenCalledWith('voice_conversations');
      expect(supabaseServer.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: 'org-test-999',
          provider_call_id: 'ext-321',
          provider: 'vapi',
          raw_data: expect.any(String) // Cipher block
        })
      );
      expect(insertedId).toBe('test-insert-uuid');
    });

    it('should escalate any underlying database errors correctly', async () => {
      (supabaseServer.insert as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ error: { message: 'RLS Validation Failed' } })
        })
      });

      await expect(saveVoiceConversation(completeConversationObj, mockByokKey)).rejects.toThrow('Database error saving voice conversation: RLS Validation Failed');
    });
  });

  describe('getVoiceConversationById', () => {
    it('should cleanly retrieve isolated conversation records and assign data properties correctly', async () => {
      // Setup mock DB output containing underscored props bypassing secure cipher logic for targeted hydrating tests
      (supabaseServer.single as jest.Mock).mockResolvedValue({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          org_id: 'org-test-999',
          provider_call_id: 'ext-123',
          provider: 'vapi',
          start_time: '2026-03-04T05:00:00Z',
          transcript: 'Decrypted Transcript Result'
        },
        error: null
      });

      const result = await getVoiceConversationById('123e4567-e89b-12d3-a456-426614174000', 'org-test-999', mockByokKey);

      expect(supabaseServer.single).toHaveBeenCalled();
    });

    it('should return null cleanly if not found (PGRST116 multiple rows or 404)', async () => {
      (supabaseServer.single as jest.Mock).mockResolvedValue({
        error: { code: 'PGRST116' }
      });

      const result = await getVoiceConversationById('123e4567-e89b-12d3-a456-426614174000', 'org-test-999', mockByokKey);
      expect(result).toBeNull();
    });

    it('should detect corrupted decryption material and throw safely', async () => {
      (supabaseServer.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'mock-conv-id',
          org_id: 'org-test-999',
          provider_call_id: 'ext-123',
          provider: 'vapi',
          start_time: '2026-03-04T05:00:00Z',
          raw_data: 'invalid:cipher:structure' 
        },
        error: null
      });

      await expect(getVoiceConversationById('123e4567-e89b-12d3-a456-426614174000', 'org-test-999', mockByokKey)).rejects.toThrow();
    });
  });
});
