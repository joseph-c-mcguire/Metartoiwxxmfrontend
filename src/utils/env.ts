const REQUIRED_ENV = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
  'VITE_BACKEND_URL',
  'VITE_AUTH_SERVICE_URL',
  'VITE_APP_URL',
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV)[number];

export function getRequiredEnvVar(key: RequiredEnvKey): string {
  const value = import.meta.env[key];
  if (!value || typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  if (import.meta.env.PROD && (value.includes('localhost') || value.includes('127.0.0.1'))) {
    throw new Error(`Invalid production value for ${key}: localhost is not allowed`);
  }

  return value.trim().replace(/\/$/, '');
}

export function validateRequiredFrontendEnv(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  REQUIRED_ENV.forEach((key) => {
    try {
      getRequiredEnvVar(key);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}
