import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GovernancePipeline } from '../../lib/governance/governancePipeline';
import { supabaseServer } from '../../lib/supabaseServer';

vi.mock('../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    insert: vi.fn(),
    rpc: vi.fn()
  }
}));

describe('GovernancePipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects execution if user_id is missing', async () => {
    await expect(
      GovernancePipeline.execute({
        org_id: 'org-123',
        prompt: 'test prompt',
      } as any)
    ).rejects.toThrow('MISSING_IDENTITY');
  });
});
