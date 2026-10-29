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
  AUTH_TRUSTED_ORIGINS: z
    .string()
    .default(
      'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000',
    )
    .transform((value, ctx) => {
      const origins = value.split(',').map((v) => v.trim());
      if (
        !origins.length ||
        origins.some((v) => {
          try {
            return new URL(v).origin !== v;
          } catch {
            return true;
          }
        })
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Exact trusted HTTP origins required',
        });
      }
      return origins;
    }),
});
export function readEnv(input: NodeJS.ProcessEnv = process.env) {
  const env = envSchema.parse(input);
  if (
    env.NODE_ENV === 'production' &&
    (!input.AUTH_TRUSTED_ORIGINS ||
      env.AUTH_TRUSTED_ORIGINS.some((v) => !v.startsWith('https://')))
  )
    throw new Error('Production requires explicit HTTPS AUTH_TRUSTED_ORIGINS');
  return env;
}
