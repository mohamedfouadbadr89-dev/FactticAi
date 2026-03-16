import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authorizeOrgAccess, AuthorizationError } from '../../lib/security/authorizeOrgAccess';
import { supabaseServer } from '../../lib/supabaseServer';

vi.mock('../../lib/supabaseServer', () => ({
  supabaseServer: {
    from: vi.fn(),
  }
}));

describe('authorizeOrgAccess', () => {
  let mockEq: any;
  let mockMaybeSingle: any;
  let mockInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockMaybeSingle = vi.fn();
    mockEq = vi.fn().mockImplementation(() => ({
      eq: mockEq,
      maybeSingle: mockMaybeSingle,
    }));
    
    mockInsert = vi.fn();

    (supabaseServer.from as any).mockImplementation((table: string) => {
      if (table === 'org_members') {
        return { select: () => ({ eq: mockEq }) };
      }
      if (table === 'audit_logs') {
        return { insert: mockInsert };
      }
      return {};
    });
  });

  it('passes for a valid user + org membership', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { id: 'valid-member-id' }, error: null });

    await expect(authorizeOrgAccess('human-user-123', 'org-123')).resolves.not.toThrow();
    
    expect(supabaseServer.from).toHaveBeenCalledWith('org_members');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'human-user-123');
    expect(mockEq).toHaveBeenCalledWith('org_id', 'org-123');
  });

  it('throws CROSS_TENANT_ACCESS_DENIED for invalid membership', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await expect(authorizeOrgAccess('human-user-123', 'org-123'))
      .rejects.toThrowError(/CROSS_TENANT_ACCESS_DENIED/);
  });

  describe('System Principals', () => {
    const systemIdentities = [
      'system-cron-health',
      'system-diagnostic',
      'system-simulator',
      'system-audit'
    ];

    it.each(systemIdentities)('bypasses membership query for valid system principal: %s', async (systemId) => {
      await expect(authorizeOrgAccess(systemId, 'org-123')).resolves.not.toThrow();

      // Ensure org_members was bypassed entirely
      expect(mockMaybeSingle).not.toHaveBeenCalled();

      // Ensure audit_logs received the system bypass execution event
      expect(supabaseServer.from).toHaveBeenCalledWith('audit_logs');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        action: 'SYSTEM_PIPELINE_EXECUTION',
        metadata: expect.objectContaining({
          system_identity: true,
          user_id: systemId
        })
      }));
    });
  });
});
