import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.string().optional().default("5000"),
  WS_PORT: z.string().optional().default("3003"),

  // Security Secrets
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters long"),
  INTERNAL_WS_SECRET: z.string().min(8, "INTERNAL_WS_SECRET must be at least 8 characters long").optional(),
  ENCRYPTION_KEY: z.string().optional(),

  // URLs
  NEXT_PUBLIC_API_URL: z.string().url("NEXT_PUBLIC_API_URL must be a valid URL").optional().default("http://localhost:5000/api"),
  NEXT_PUBLIC_WS_URL: z.string().url("NEXT_PUBLIC_WS_URL must be a valid URL").optional().default("http://localhost:3003"),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().optional().default("orbit-99e42"),

  // Optional Services
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  CASHFREE_CLIENT_ID: z.string().optional(),
  CASHFREE_CLIENT_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates process.env at server startup.
 * Throws an error and halts execution if validation fails.
 */
export function validateEnv(): Env {
  // If in dev or test mode and JWT_SECRET is not set, provide a explicit dev fallback but log warning
  if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
    process.env.JWT_SECRET = "dev-secret-key-orbit-must-change-in-prod-123456789";
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables configuration:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error("Invalid environment variables. Server boot aborted.");
  }

  console.log("✅ Environment variables successfully validated.");
  return result.data;
}
