import { z } from 'zod';
export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .url()
    .refine((v) => /^postgres(ql)?:/.test(v), 'PostgreSQL URL required'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
});
export function readEnv(input: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(input);
}
