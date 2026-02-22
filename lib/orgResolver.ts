/**
 * Org Resolver
 * 
 * Extracts x-org-id from request headers.
 * All Level 1 endpoints require this for deterministic scoping.
 */
export const resolveOrgId = (req: Request): string | null => {
  return req.headers.get('x-org-id');
};
