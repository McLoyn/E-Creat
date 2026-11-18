import 'dotenv/config';

export interface AppConfig {
  port: number;
  host: string;
  nodeEnv: string;
  isProduction: boolean;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  webOrigins: string[];
  cookieSecure: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  supabaseStorageBucket: string;
}

function parseAllowedOrigins(originEnv?: string): string[] {
  if (!originEnv || originEnv.trim() === '' || originEnv === '*') {
    // In development fallback to common local origins if none specified
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WEB_ORIGIN wajib ditentukan dengan URL eksplisit pada mode production (wildcard dilarang).');
    }
    return ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000', 'http://127.0.0.1:4000'];
  }
  return originEnv.split(',').map((o) => o.trim()).filter(Boolean);
}

const INSECURE_DEFAULT_SECRETS = [
  'ekraf_access_secret_super_secure_key_12345',
  'ekraf_refresh_secret_super_secure_key_67890',
  'secret',
  'changeme',
  '12345678',
];

export function validateAndLoadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '127.0.0.1';

  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
    if (isProduction || !jwtAccessSecret) {
      throw new Error(
        'Konfigurasi Keamanan Kritis: JWT_ACCESS_SECRET wajib diisi dan memiliki panjang minimal 32 karakter.'
      );
    }
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    if (isProduction || !jwtRefreshSecret) {
      throw new Error(
        'Konfigurasi Keamanan Kritis: JWT_REFRESH_SECRET wajib diisi dan memiliki panjang minimal 32 karakter.'
      );
    }
  }

  if (isProduction) {
    if (
      INSECURE_DEFAULT_SECRETS.includes(jwtAccessSecret!) ||
      INSECURE_DEFAULT_SECRETS.includes(jwtRefreshSecret!)
    ) {
      throw new Error('Konfigurasi Keamanan Kritis: Dilarang menggunakan default secret pada production environment.');
    }
  }

  const webOrigins = parseAllowedOrigins(process.env.WEB_ORIGIN);

  const cookieSecure =
    process.env.COOKIE_SECURE === 'true' || (isProduction && process.env.COOKIE_SECURE !== 'false');

  const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

  return {
    port,
    host,
    nodeEnv,
    isProduction,
    databaseUrl,
    jwtAccessSecret: jwtAccessSecret || 'dev_temporary_insecure_access_secret_only_for_test_at_least_32_chars_long',
    jwtRefreshSecret: jwtRefreshSecret || 'dev_temporary_insecure_refresh_secret_only_for_test_at_least_32_chars_long',
    webOrigins,
    cookieSecure,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'ekraf-public',
  };
}

export const envConfig = validateAndLoadConfig();
