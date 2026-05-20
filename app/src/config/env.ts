type EnvName =
  | 'VITE_SUPABASE_URL'
  | 'VITE_SUPABASE_ANON_KEY'
  | 'VITE_BILLING_PROVIDER'
  | 'VITE_TOSS_CLIENT_KEY'
  | 'VITE_TOSS_MONTHLY_FLOW_URL'
  | 'VITE_TOSS_LIFETIME_FLOW_URL';

function readEnv(name: EnvName): string {
  const value = import.meta.env[name]?.trim();
  return value ?? '';
}

export const appEnv = {
  supabaseUrl: readEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: readEnv('VITE_SUPABASE_ANON_KEY'),
  billingProvider: readEnv('VITE_BILLING_PROVIDER'),
  tossClientKey: readEnv('VITE_TOSS_CLIENT_KEY'),
  tossMonthlyFlowUrl: readEnv('VITE_TOSS_MONTHLY_FLOW_URL'),
  tossLifetimeFlowUrl: readEnv('VITE_TOSS_LIFETIME_FLOW_URL'),
};

export function hasSupabaseEnv(): boolean {
  return Boolean(appEnv.supabaseUrl && appEnv.supabaseAnonKey);
}

function normalizeBasePath(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed || trimmed === './' || trimmed === '/') {
    return '';
  }

  const withoutTrailingSlash = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  return withoutTrailingSlash.startsWith('/') ? withoutTrailingSlash : `/${withoutTrailingSlash}`;
}

export function getAppBasePath(): string {
  if (typeof window !== 'undefined' && !window.electronAPI) {
    const pathname = window.location.pathname;
    const runtimeCandidates = ['/apps/noleji-view', '/docwise'];
    const matched = runtimeCandidates.find((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
    if (matched) {
      return matched;
    }
  }

  return normalizeBasePath(import.meta.env.BASE_URL ?? '/');
}

export function getAppUrl(path = ''): string {
  if (typeof window === 'undefined') {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${window.location.origin}${getAppBasePath()}${path ? normalizedPath : ''}`;
}

export function getSupabaseAuthRedirectUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  if (window.electronAPI) {
    return 'http://localhost';
  }

  return getAppUrl('/app');
}
