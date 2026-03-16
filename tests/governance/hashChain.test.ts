import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { verifyLedgerIntegrity } from '../../lib/evidence/evidenceLedger';
import { supabaseServer } from '../../lib/supabaseServer';

vi.mock('../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn(),
  }
}));

// Local helpers mapping the logic of evidenceLedger for testing.
function computeEventHash(fields: any): string {
  const input =
    fields.session_id +
    fields.timestamp +
    (fields.prompt || '') +
    fields.decision +
    fields.risk_score +
    JSON.stringify(fields.violations || []) +
    fields.previous_hash;
  return crypto.createHash('sha256').update(input).digest('hex');
}

function computeSignature(eventHash: string): string {
  const secret = process.env.GOVERNANCE_SECRET || 'test_secret';
  return crypto.createHmac('sha256', secret).update(eventHash).digest('hex');
}

describe('Hash Chain Integrity', () => {
  let mockSelect: any, mockEq: any, mockOrder: any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOVERNANCE_SECRET = 'test_secret';

    mockOrder = vi.fn();
    mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    (supabaseServer.from as any).mockReturnValue({ select: mockSelect });
  });

  it('validates a correct governance event chain', async () => {
    // Generate valid chain
    const ts1 = new Date().toISOString();
    const event1Hash = computeEventHash({
      session_id: 'sess-123', timestamp: ts1, prompt: 'test 1', decision: 'ALLOW',
      risk_score: 0, violations: [], previous_hash: 'GENESIS_HASH'
    });

    const ts2 = new Date().toISOString();
    const event2Hash = computeEventHash({
      session_id: 'sess-123', timestamp: ts2, prompt: 'test 2', decision: 'WARN',
      risk_score: 50, violations: [], previous_hash: event1Hash
    });

    const mockEvents = [
      {
        id: 'evt-1', session_id: 'sess-123', org_id: 'org-1', timestamp: ts1,
        prompt: 'test 1', decision: 'ALLOW', risk_score: 0, violations: [],
        previous_hash: 'GENESIS_HASH', event_hash: event1Hash,
        signature: computeSignature(event1Hash)
      },
      {
        id: 'evt-2', session_id: 'sess-123', org_id: 'org-1', timestamp: ts2,
        prompt: 'test 2', decision: 'WARN', risk_score: 50, violations: [],
        previous_hash: event1Hash, event_hash: event2Hash,
        signature: computeSignature(event2Hash)
      }
    ];

    mockOrder.mockResolvedValue({ data: mockEvents, error: null });

    const result = await verifyLedgerIntegrity('sess-123', 'org-1');
    
    // Verify event2.previous_hash === event1.event_hash equivalent check passed:
    expect(result.integrity_status).toBe('INTEGRITY_VALID');
    expect(result.verified_events).toBe(2);
    expect(mockEvents[1].previous_hash).toBe(mockEvents[0].event_hash);
  });

  it('detects ledger tampering when metadata is modified', async () => {
    const ts1 = new Date().toISOString();
    const validHash = computeEventHash({
      session_id: 'sess-123', timestamp: ts1, prompt: 'valid prompt', decision: 'ALLOW',
      risk_score: 0, violations: [], previous_hash: 'GENESIS_HASH'
    });

    const mockEvents = [{
      id: 'evt-1', session_id: 'sess-123', org_id: 'org-1', timestamp: ts1,
      // TAMPERED DATA!
      prompt: 'manipulated prompt', decision: 'BLOCK', risk_score: 99, violations: [{ policy: 'tampered' }],
      previous_hash: 'GENESIS_HASH', event_hash: validHash,
      signature: computeSignature(validHash)
    }];

    mockOrder.mockResolvedValue({ data: mockEvents, error: null });

    const result = await verifyLedgerIntegrity('sess-123', 'org-1');
    expect(result.integrity_status).toBe('HASH_MISMATCH');
    expect(result.tamper_type).toBe('DATA_MUTATION');
    expect(result.broken_event_id).toBe('evt-1');
  });
});
