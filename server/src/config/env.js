import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('4000').transform((v) => parseInt(String(v), 10)),
  NODE_ENV: z.string().default('production'),
  CORS_ORIGIN: z.string().default('*'),
  SUPABASE_URL: z.string().default('https://flxccuowqflxtwtynvml.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  WHATSAPP_BUSINESS_NUMBER: z.string().default('919605210198').transform((v) => String(v).replace(/\D/g, '')),
  RESERVATION_EXPIRY_MINUTES: z.union([z.string(), z.number()]).default('120').transform((v) => parseInt(String(v), 10)),
  TEST_ADMIN_EMAIL: z.string().default('admin@bear.in'),
  TEST_ADMIN_PASSWORD: z.string().optional().default(''),
  TEST_MANAGER_EMAIL: z.string().default('manager@bear.in'),
  TEST_MANAGER_PASSWORD: z.string().optional().default(''),
  TEST_CUSTOMER_EMAIL: z.string().default('customer@example.com'),
  TEST_CUSTOMER_PASSWORD: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('Backend environment configuration warning (using safe defaults):', parsed.error.format());
}

export const env = parsed.success
  ? parsed.data
  : envSchema.parse({
      ...process.env,
      SUPABASE_URL: process.env.SUPABASE_URL || 'https://flxccuowqflxtwtynvml.supabase.co',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    });

