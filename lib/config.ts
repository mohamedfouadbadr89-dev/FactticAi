/**
 * Environment Configuration Loader
 * 
 * Centralized config management.
 */

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Simple validation
if (!config.supabase.url || !config.supabase.anonKey) {
  if (config.isProduction) {
    throw new Error('Missing critical Supabase configuration in production.');
  } else {
    console.warn('Supabase configuration is missing. Local development may be limited.');
  }
}
