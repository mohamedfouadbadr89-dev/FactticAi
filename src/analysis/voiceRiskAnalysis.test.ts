import { analyzeVoiceConversation } from './voiceRiskAnalysis';
import { VoiceConversation } from '../models/VoiceConversation';
import { saveRiskScore } from '../database/voiceRiskScores';

jest.mock('../database/voiceRiskScores', () => ({
  saveRiskScore: jest.fn().mockResolvedValue('mock-risk-id')
}));

describe('Risk Analysis Engine (`analyzeVoiceConversation`)', () => {

  const standardConv = new VoiceConversation({
    id: '223e4567-e89b-12d3-a456-426614174000',
    orgId: 'org-test-999',
    provider: 'vapi',
    externalId: 'ext-999',
    startTime: new Date('2026-03-04T05:00:00Z'),
    transcript: 'Hello, how can I help you today? I would like to check my balance. Sure thing.'
  });

  const piiLeakConv = new VoiceConversation({
    ...standardConv,
    transcript: 'My social security number is 123-45-6789 and my email is test@example.com'
  });

  const legalThreatConv = new VoiceConversation({
    ...standardConv,
    transcript: 'If you do not fix this immediately I will sue you and contact my lawyer.'
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process a standard benign conversation without triggering severe policy violations', async () => {
    const result = await analyzeVoiceConversation(standardConv);

    expect(result!.score).toBeGreaterThanOrEqual(0); // Base default is at least slightly > 0 given duration heuristics usually kick in slightly
    expect(result!.violations).toHaveLength(0);
    expect(saveRiskScore).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: '223e4567-e89b-12d3-a456-426614174000',
        orgId: 'org-test-999'
      })
    );
  });

  it('should aggressively flag numeric PII leak patterns', async () => {
    const result = await analyzeVoiceConversation(piiLeakConv);

    expect(result!.violations).toContain('Potential PII exposure (SSN/CC)');
    expect(result!.score).toBeGreaterThanOrEqual(40); // Heuristic applies +40 for PII
  });

  it('should spike risk score severely when explicit legal threats are present', async () => {
    const result = await analyzeVoiceConversation(legalThreatConv);

    expect(result!.violations).toContain('Legal threat detected');
    expect(result!.score).toBeGreaterThanOrEqual(50); // Heuristic applies +50 for legal threats
  });

  it('should combine multiple heuristics cumulatively in extreme cases', async () => {
    const extremeConv = new VoiceConversation({
      ...standardConv,
      transcript: 'I will literally sue you lawyer social security 123-45-6789 worst service ever idiot' // legal + pii + negative sentiment
    });

    const result = await analyzeVoiceConversation(extremeConv);
    expect(result!.score).toBeGreaterThanOrEqual(90); // Capped gracefully near 100 usually
    expect(result!.violations.length).toBeGreaterThanOrEqual(2);
  });
});
