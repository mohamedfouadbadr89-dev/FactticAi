import { saveRiskScore, getRiskScoresByConversationId } from './voiceRiskScores';
import { supabaseServer } from '@/lib/supabaseServer';

// We'll set up the mocks globally but let jest handle module replacement first
const mockEq = jest.fn();
mockEq.mockReturnValue({ eq: mockEq });
const mockSelect = jest.fn();
const mockInsert = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }) }) });
const mockFrom = jest.fn().mockReturnValue({
  insert: mockInsert,
  select: mockSelect,
});

jest.mock('@/lib/supabaseServer', () => {
  return {
    supabaseServer: {
      get from() { return mockFrom; }
    }
  };
});

describe('Voice Risk Scores Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockConversationId = '987e6543-e21b-12d3-a456-426614174000';

  describe('saveRiskScore', () => {
    it('should save risk score and return id', async () => {
      const input = {
        conversationId: mockConversationId,
        orgId: mockOrgId,
        riskScore: 85,
        flaggedPolicies: ['test-policy'],
      };

      const result = await saveRiskScore(input);
      expect(mockFrom).toHaveBeenCalledWith('voice_risk_scores');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: mockConversationId,
          org_id: mockOrgId,
          risk_score: 85,
          flagged_policies: ['test-policy'],
        })
      );
      expect(result).toBe('mock-id');
    });

    it('should throw an error if org_id is missing', async () => {
      const input = {
        conversationId: mockConversationId,
        orgId: '',
        riskScore: 85,
        flaggedPolicies: ['test-policy'],
      };

      await expect(saveRiskScore(input)).rejects.toThrow('conversationId and orgId are required to save a risk score.');
    });
  });

  describe('getRiskScoresByConversationId', () => {
    it('should retrieve joined risk scores filtering by org_id', async () => {
      // Mock the nested chained call structure
      const chainEq2 = jest.fn().mockResolvedValue({ 
        data: [{
          id: 'test-risk-id',
          conversation_id: mockConversationId,
          org_id: mockOrgId,
          risk_score: 90,
          flagged_policies: [],
          created_at: '2026-03-03T22:00:00.000Z',
          voice_conversations: { id: mockConversationId, org_id: mockOrgId }
        }], 
        error: null 
      });
      const chainEq1 = jest.fn().mockReturnValue({ eq: chainEq2 });
      mockSelect.mockReturnValueOnce({ eq: chainEq1 });

      const result = await getRiskScoresByConversationId(mockConversationId, mockOrgId);
      
      expect(mockFrom).toHaveBeenCalledWith('voice_risk_scores');
      // Assert that we called the inner join format
      expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('voice_conversations!inner(id, org_id)'));
      expect(chainEq1).toHaveBeenCalledWith('conversation_id', mockConversationId);
      expect(chainEq2).toHaveBeenCalledWith('org_id', mockOrgId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test-risk-id');
    });

    it('should throw an error on database fetch failure', async () => {
      const chainEq2 = jest.fn().mockResolvedValue({ data: null, error: { message: 'Network error' } });
      const chainEq1 = jest.fn().mockReturnValue({ eq: chainEq2 });
      mockSelect.mockReturnValueOnce({ eq: chainEq1 });

      await expect(getRiskScoresByConversationId(mockConversationId, mockOrgId)).rejects.toThrow('Database error fetching risk scores: Network error');
    });
  });
});
