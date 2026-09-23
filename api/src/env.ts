import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  FRONTEND_URL: z.string().min(1).default("http://localhost:5173"),
  NODE_ENV: z.string().optional(),
  JWT_SECRET: z.string().min(16),
  DATABASE_SSL: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  OPENAI_API_KEY: z.string().optional(),
  OPENIA_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENIA_MODEL: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  DB_SCHEMA: z
    .string()
    .default("WVENTA_ONLINE")
    .refine((s) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s), "DB_SCHEMA must be a valid PostgreSQL identifier (e.g. WVENTA_ONLINE)"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional().default("Tienda Online <onboarding@resend.dev>"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional().default("http://localhost:3001/auth/google/callback"),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_WHATSAPP_FROM: z.string().optional(),
  TWILIO_WHATSAPP_TO: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
