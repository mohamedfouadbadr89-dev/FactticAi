import { analyzeVoiceConversation } from './voiceRiskAnalysis';
import { getVoiceConversationById } from '@/database/voiceConversations';
import { saveRiskScore } from '@/database/voiceRiskScores';
import { VoiceConversation } from '@/models/VoiceConversation';

// Mock the dependencies
jest.mock('@/database/voiceConversations');
jest.mock('@/database/voiceRiskScores');
jest.mock('@/lib/supabaseServer', () => ({
  supabaseServer: {}
}));

describe('Voice Risk Analysis Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
  const mockConversationId = '987e6543-e21b-12d3-a456-426614174000';

  const mockConversation = new VoiceConversation({
      id: mockConversationId,
      orgId: mockOrgId,
      provider: 'vapi',
      externalId: 'ext-id',
      startTime: new Date(),
  });

  it('should fetch the conversation and run analysis logic successfully', async () => {
    (getVoiceConversationById as jest.Mock).mockResolvedValueOnce(mockConversation);
    
    // Setup Mock DB Update
    (saveRiskScore as jest.Mock).mockResolvedValueOnce('mock-id');

    const result = await analyzeVoiceConversation(mockConversationId, mockOrgId);

    // Assert dependency parameters are correctly scoped to the tenant
    expect(getVoiceConversationById).toHaveBeenCalledWith(mockConversationId, mockOrgId);
    
    // Assert the DB update isolates the data modification by org_id
    expect(saveRiskScore).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: mockConversationId,
        orgId: mockOrgId,
        riskScore: expect.any(Number),
        flaggedPolicies: expect.any(Array),
      })
    );

    expect(result).not.toBeNull();
    expect(result?.score).toBeGreaterThanOrEqual(0);
  });

  it('should abort and return null if the conversation cannot be found (tenant isolation enforcement)', async () => {
    // getVoiceConversationById enforces the orgId internally, returning null if it misses
    (getVoiceConversationById as jest.Mock).mockResolvedValueOnce(null);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await analyzeVoiceConversation(mockConversationId, mockOrgId);

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(`[Risk Engine] Voice conversation ${mockConversationId} not found for org ${mockOrgId}. Aborting analysis.`);
    expect(saveRiskScore).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('should format errors from database failures gracefully', async () => {
    (getVoiceConversationById as jest.Mock).mockResolvedValueOnce(mockConversation);
    
    // Mock a DB Update failure
    (saveRiskScore as jest.Mock).mockRejectedValueOnce(new Error('Database constraint error'));

    await expect(analyzeVoiceConversation(mockConversationId, mockOrgId)).rejects.toThrow('Failed to update conversation with risk analysis: Database constraint error');
  });
});
