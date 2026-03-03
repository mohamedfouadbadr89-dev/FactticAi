import { createServerAuthClient } from '@/lib/supabaseAuth'

export interface AuthResult {
  user: { id: string; email?: string } | null
  error: string | null
  status: number
}

export async function withAuth(_req?: Request): Promise<AuthResult> {
  try {
    const supabase = await createServerAuthClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session?.user) {
      return { user: null, error: 'UNAUTHORIZED', status: 401 }
    }

    return { user: session.user, error: null, status: 200 }
  } catch {
    return { user: null, error: 'AUTH_ERROR', status: 500 }
  }
}

export async function logout() {
  const supabase = await createServerAuthClient()
  await supabase.auth.signOut()
  return true
}
