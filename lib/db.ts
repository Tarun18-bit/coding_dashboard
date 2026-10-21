import { createClient } from '@supabase/supabase-js';

// If in Node.js environment (e.g. scripts or test runs), load .env.local
if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env.local' });
    dotenv.config();
  } catch {
    // Ignore in browser or production Next.js runtime
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Public client for client-side queries
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side API routes & syncing (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
