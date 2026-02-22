/**
 * Org Resolver Middleware
 * 
 * Extracts organization context from request headers.
 */

export const resolveOrg = async (req: Request) => {
  const orgSlug = req.headers.get('x-org-slug');
  
  if (!orgSlug) {
    return null;
  }

  // In a real scenario, this would call the DB RPC 'resolve_org'
  // using the service role or the user's token.
  return orgSlug;
};

export const orgMiddleware = async (req: Request) => {
  const orgId = await resolveOrg(req);
  
  if (!orgId && !req.url.includes('/health')) {
    return new Response(JSON.stringify({ error: 'Organization context required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
};
