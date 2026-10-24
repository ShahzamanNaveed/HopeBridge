import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import net from 'node:net';
// Reserve an unused local port for a deliberately unavailable database.
const reservation = net.createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const dbPort = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const appPort = Number(process.env.SMOKE_PORT ?? 3109);
const child = spawn(process.execPath, ['apps/backend/dist/server.js'], {
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(appPort),
    DATABASE_URL:
      'postgresql://smoke:smoke@127.0.0.1:' + dbPort + '/unavailable',
    LOG_LEVEL: 'silent',
  },
  stdio: 'pipe',
});
let output = '';
child.stderr.on('data', (chunk) => {
  output += chunk;
});
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    if (child.exitCode !== null) throw new Error(output);
    try {
      const r = await fetch('http://127.0.0.1:' + appPort + '/api/v1');
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* The server may still be starting. */
    }
    await delay(250);
  }
  assert.ok(ready, 'production server must start');
  const origin = 'http://127.0.0.1:' + appPort;
  for (const route of ['/', '/about', '/dashboard']) {
    const r = await fetch(origin + route, { headers: { Accept: 'text/html' } });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /<div id="root"><\/div>/);
  }
  const health = await fetch(origin + '/health');
  assert.equal(health.status, 503);
  assert.deepEqual((await health.json()).data, {
    status: 'unavailable',
    database: 'down',
  });
  const missing = await fetch(origin + '/api/missing');
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).error.code, 'NOT_FOUND');
  assert.equal((await fetch(origin + '/missing.js')).status, 404);
  console.log(
    'PASS: production SPA routes, API errors, missing assets, real database-unavailable readiness',
  );
} finally {
  child.kill();
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    delay(5000),
  ]);
}
