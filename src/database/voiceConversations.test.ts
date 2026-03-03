import { saveVoiceConversation, getVoiceConversationById } from './voiceConversations';
import { supabaseServer } from '@/lib/supabaseServer';
import { VoiceConversation } from '@/models/VoiceConversation';

// Mock Supabase Server client
jest.mock('@/lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

describe('Voice Conversations Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockConversationId = '987e6543-e21b-12d3-a456-426614174000';

  const createMockConversation = (orgId: string = mockOrgId) => {
    return new VoiceConversation({
      id: mockConversationId,
      orgId: orgId,
      provider: 'vapi',
      externalId: 'vapi-ext-123',
      startTime: new Date('2026-03-03T21:30:00.000Z'),
      endTime: new Date('2026-03-03T21:35:00.000Z'),
      transcript: 'Database test transcript',
      audio: 'https://example.com/audio.wav',
    });
  };

  describe('saveVoiceConversation', () => {
    it('should successfully save a VoiceConversation and return its ID', async () => {
      const mockConversation = createMockConversation();
      
      // Setup mock response for successful insert
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: { id: mockConversationId }, 
        error: null 
      });

      const resultId = await saveVoiceConversation(mockConversation);

      expect(supabaseServer.from).toHaveBeenCalledWith('voice_conversations');
      expect(supabaseServer.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockConversationId,
          org_id: mockOrgId,
          provider_call_id: 'vapi-ext-123',
          transcript: 'Database test transcript',
        })
      );
      expect(resultId).toBe(mockConversationId);
    });

    it('should throw an error if orgId is missing in the object', async () => {
      // Create a raw object without validation, strictly for testing the rejection inside saveVoiceConversation
      const invalidConv = { id: 'test', provider: 'vapi' } as any;

      await expect(saveVoiceConversation(invalidConv)).rejects.toThrow('orgId is required to save a voice conversation.');
    });

    it('should throw an error if the database insert fails', async () => {
      const mockConversation = createMockConversation();
      
      // Setup mock response for DB error
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Unique constraint violation' } 
      });

      await expect(saveVoiceConversation(mockConversation)).rejects.toThrow('Database error saving voice conversation: Unique constraint violation');
    });
  });

  describe('getVoiceConversationById', () => {
    it('should successfully fetch a conversation matching ID and orgId', async () => {
      // Setup mock DB output containing underscored props
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: {
          id: mockConversationId,
          org_id: mockOrgId,
          provider: 'retell',
          provider_call_id: 'retell-ext-789',
          start_time: '2026-03-03T22:00:00.000Z',
          transcript: 'Hello again',
          raw_data: { meta: true }
        }, 
        error: null 
      });

      const result = await getVoiceConversationById(mockConversationId, mockOrgId);

      expect(supabaseServer.from).toHaveBeenCalledWith('voice_conversations');
      expect(supabaseServer.select).toHaveBeenCalledWith('*');
      expect(supabaseServer.eq).toHaveBeenCalledWith('id', mockConversationId);
      expect(supabaseServer.eq).toHaveBeenCalledWith('org_id', mockOrgId); // Data isolation validation check
      
      expect(result).toBeInstanceOf(VoiceConversation);
      if (result) {
        expect(result.id).toBe(mockConversationId);
        expect(result.orgId).toBe(mockOrgId);
        expect(result.provider).toBe('retell');
        expect(result.transcript).toBe('Hello again');
        expect(result.metadata).toEqual({ meta: true });
      }
    });

    it('should return null if no conversation is found (PGRST116)', async () => {
      // PGROST116 is the "row not found" code for Supabase JS .single()
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows' } 
      });

      const result = await getVoiceConversationById(mockConversationId, mockOrgId);

      expect(result).toBeNull();
    });

    it('should return null if querying with the WRONG orgId (data isolation verified)', async () => {
      const wrongOrgId = '00000000-0000-0000-0000-000000000000';
      
      // When querying with the wrong orgId, no row is returned
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'PGRST116', message: 'No rows' } 
      });

      const result = await getVoiceConversationById(mockConversationId, wrongOrgId);

      expect(result).toBeNull();
      // Ensure the wrong orgId was correctly queried
      expect(supabaseServer.eq).toHaveBeenCalledWith('org_id', wrongOrgId);
    });

    it('should throw an error for unexpected database failures', async () => {
      (supabaseServer.single as jest.Mock).mockResolvedValueOnce({ 
        data: null, 
        error: { code: 'UNKNOWN', message: 'Connection timed out' } 
      });

      await expect(getVoiceConversationById(mockConversationId, mockOrgId)).rejects.toThrow('Database error fetching voice conversation: Connection timed out');
    });
    
    it('should throw an error if parameters are missing', async () => {
       await expect(getVoiceConversationById('', mockOrgId)).rejects.toThrow('Both id and orgId are required to retrieve a voice conversation.');
       await expect(getVoiceConversationById(mockConversationId, '')).rejects.toThrow('Both id and orgId are required to retrieve a voice conversation.');
    });
  });
});
