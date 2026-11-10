import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGO_URL: z.string().min(1),
  MONGO_DB: z.string().min(1),
});

export const config = envSchema.parse(process.env);
