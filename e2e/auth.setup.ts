import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/backend/src/generated/prisma/client.js';
import { AuthRepository } from '../apps/backend/src/modules/auth/auth.repository.js';
import { bootstrapSuperAdmin } from '../apps/backend/src/modules/auth/bootstrap.js';

export default async function setup() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  config({ path: resolve(root, '.env'), quiet: true });
  const url = new URL(process.env.DATABASE_URL ?? 'invalid:');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
    throw new Error('E2E requires a local disposable database');
  const name = `hopebridge_e2e_auth_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  url.pathname = `/${name}`;
  const env = {
    ...process.env,
    DATABASE_URL: url.toString(),
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    PORT: '3301',
    AUTH_TRUSTED_ORIGINS: 'http://127.0.0.1:5174',
    API_PROXY_TARGET: 'http://127.0.0.1:3301',
  };
  let backend: ReturnType<typeof spawn> | undefined;
  let frontend: ReturnType<typeof spawn> | undefined;
  const clean = async () => {
    for (const child of [backend, frontend])
      if (child && child.exitCode === null) {
        child.kill();
        await new Promise<void>((done) => child.once('exit', () => done()));
      }
    await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
  };
  try {
    execFileSync(
      process.execPath,
      [
        resolve(root, 'node_modules/prisma/build/index.js'),
        'migrate',
        'deploy',
        '--config',
        'apps/backend/prisma.config.ts',
      ],
      { cwd: root, env, stdio: 'pipe' },
    );
    const db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url.toString() }),
    });
    try {
      const boot = await bootstrapSuperAdmin(new AuthRepository(db), {
        email: 'browser-admin@example.test',
        displayName: 'Synthetic browser admin',
      });
      process.env.AUTH_E2E_PASSWORD = boot!.temporaryPassword;
      process.env.AUTH_E2E_DATABASE = url.toString();
    } finally {
      await db.$disconnect();
    }
    backend = spawn(
      process.execPath,
      [
        resolve(root, 'node_modules/tsx/dist/cli.mjs'),
        resolve(root, 'e2e/runtime-server.ts'),
      ],
      {
        cwd: resolve(root, 'apps/backend'),
        env,
        stdio: 'ignore',
        windowsHide: true,
      },
    );
    frontend = spawn(
      process.execPath,
      [
        resolve(root, 'node_modules/vite/bin/vite.js'),
        '--host',
        '127.0.0.1',
        '--port',
        '5174',
      ],
      {
        cwd: resolve(root, 'apps/frontend'),
        env,
        stdio: 'ignore',
        windowsHide: true,
      },
    );
    for (const target of [
      'http://127.0.0.1:3301/health',
      'http://127.0.0.1:5174',
    ]) {
      const deadline = Date.now() + 30000;
      while (true) {
        try {
          if ((await fetch(target)).ok) break;
        } catch {
          /* startup */
        }
        if (Date.now() > deadline)
          throw new Error('Authentication E2E server did not become ready');
        await new Promise((done) => setTimeout(done, 250));
      }
    }
    return clean;
  } catch (error) {
    await clean();
    throw error;
  }
}
