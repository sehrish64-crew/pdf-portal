import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function createMissingEnvClient() {
  const queryResult = { data: null, error: new Error('Missing Supabase environment variables') };

  const builder = {
    select() {
      return builder;
    },
    insert() {
      return builder;
    },
    update() {
      return builder;
    },
    delete() {
      return builder;
    },
    order() {
      return builder;
    },
    eq() {
      return builder;
    },
    single() {
      return Promise.resolve(queryResult);
    },
    then(onFulfilled: (value: typeof queryResult) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(queryResult).then(onFulfilled, onRejected);
    },
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getUser: async () => ({ data: { user: null }, error: new Error('Missing Supabase environment variables') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
      signUp: async () => ({ data: null, error: new Error('Missing Supabase environment variables') }),
      signOut: async () => ({ error: null }),
    },
    from() {
      return builder;
    },
  } as const;
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  })
  : createMissingEnvClient();
