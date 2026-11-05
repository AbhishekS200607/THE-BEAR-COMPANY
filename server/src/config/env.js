import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174,http://localhost:5175'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  WHATSAPP_BUSINESS_NUMBER: z.string().regex(/^91[0-9]{10}$/, 'Must be 91 followed by 10 digits').default('919605210198'),
  RESERVATION_EXPIRY_MINUTES: z.string().default('120').transform((v) => parseInt(v, 10)),
  TEST_ADMIN_EMAIL: z.string().default('admin@bear.in'),
  TEST_ADMIN_PASSWORD: z.string().optional().default(''),
  TEST_MANAGER_EMAIL: z.string().default('manager@bear.in'),
  TEST_MANAGER_PASSWORD: z.string().optional().default(''),
  TEST_CUSTOMER_EMAIL: z.string().default('customer@example.com'),
  TEST_CUSTOMER_PASSWORD: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid backend environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

