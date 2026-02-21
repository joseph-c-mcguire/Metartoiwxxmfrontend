/**
 * Supabase client initialization
 * Uses environment variables to configure the client
 */

import { createClient } from '@supabase/supabase-js';
import { getRequiredEnvVar } from '@/utils/env';

const supabaseUrl = getRequiredEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getRequiredEnvVar('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
