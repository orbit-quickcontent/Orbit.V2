import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://orbit:orbitsecret@localhost:5432/orbit_db?schema=public'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),
  JWT_SECRET: z.string().default('orbit_super_secret_jwt_key_2026_production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
  DISPATCH_TIMEOUT_SECONDS: z.string().default('15'),
  DISPATCH_RADIUS_KM: z.string().default('10'),
});

export const env = envSchema.parse(process.env);
