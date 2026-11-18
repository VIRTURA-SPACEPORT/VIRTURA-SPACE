import { createClient } from '@supabase/supabase-js';

const url = new URL('/supabase', window.location.origin).href;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = url && key
  ? createClient(url, key, {
      global: {
        fetch: (input, init) => {
          const timeout = AbortSignal.timeout(15_000);
          const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
          return fetch(input, { ...init, signal });
        },
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
