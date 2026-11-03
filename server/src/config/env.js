import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  WHATSAPP_BUSINESS_NUMBER: z.string().regex(/^91[0-9]{10}$/, 'Must be 91 followed by 10 digits').default('919605210198'),
  RESERVATION_EXPIRY_MINUTES: z.string().default('120').transform((v) => parseInt(v, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid backend environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
