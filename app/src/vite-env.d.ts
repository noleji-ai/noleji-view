/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_BILLING_PROVIDER?: 'manual' | 'toss';
  readonly VITE_TOSS_CLIENT_KEY?: string;
  readonly VITE_TOSS_MONTHLY_FLOW_URL?: string;
  readonly VITE_TOSS_LIFETIME_FLOW_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
