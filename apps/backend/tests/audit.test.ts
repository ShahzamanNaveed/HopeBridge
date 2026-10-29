import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '../src/generated/prisma/client.js';
import { appendAudit } from '../src/modules/audit/audit.service.js';
import { databaseMoney } from '../src/infrastructure/db/money-input.js';
import { allocateCitySequence } from '../src/infrastructure/db/city-sequence.js';

const id = '10000000-0000-4000-8000-000000000001';
const event = {
  actor: { kind: 'SYSTEM' as const, name: 'test' },
  domain: 'audit' as const,
  action: 'CHECK',
  entityType: 'test',
  entityId: id,
};
function transaction() {
  return {
    auditEvent: { create: vi.fn().mockResolvedValue({ id }) },
    $queryRaw: vi.fn().mockResolvedValue([{ value: 1n }]),
  };
}
const asTx = (tx: ReturnType<typeof transaction>) =>
  tx as unknown as Prisma.TransactionClient;
describe('transaction-bound sanitized audit', () => {
  it('records system attribution and redacts nested private or unknown data', async () => {
    const tx = transaction();
    await appendAudit(asTx(tx), {
      ...event,
      before: {
        status: 'PENDING',
        email: 'private@example.test',
        password: 'secret',
        metadata: { token: 'secret' },
      },
      after: {
        status: 'ACCEPTED',
        amount: '1.23',
        scope: [{ branchId: id, name: 'private' }],
        filters: null,
      },
    });
    const data = tx.auditEvent.create.mock.calls[0]?.[0].data;
    expect(data.before).toEqual({
      status: 'PENDING',
      email: '[REDACTED]',
      password: '[REDACTED]',
      metadata: '[REDACTED]',
    });
    expect(data.after.scope).toEqual([{ branchId: id, name: '[REDACTED]' }]);
    expect(data.after.filters).toBeNull();
    expect(JSON.stringify(data)).not.toContain('secret');
    expect(data.actorId).toBeUndefined();
    expect(data.systemActor).toBe('test');
  });
  it('accepts staff attribution, returning only persistence metadata', async () => {
    const tx = transaction();
    expect(
      await appendAudit(asTx(tx), {
        ...event,
        actor: { kind: 'STAFF', id },
        branchId: id,
      }),
    ).toEqual({ id });
    expect(tx.auditEvent.create.mock.calls[0]?.[0].data.actorId).toBe(id);
    expect(
      tx.auditEvent.create.mock.calls[0]?.[0].data.systemActor,
    ).toBeUndefined();
  });
  it('bounds safe strings/depth and preserves arrays/null/numbers', async () => {
    const tx = transaction();
    let deep: Record<string, unknown> = { status: 'ok' };
    for (let i = 0; i < 12; i++) deep = { scope: deep };
    await appendAudit(asTx(tx), {
      ...event,
      metadata: {
        scope: deep,
        reference: 'x'.repeat(600),
        sources: [null, 1, true],
      } as never,
    });
    const data = tx.auditEvent.create.mock.calls[0]?.[0].data.metadata;
    expect(data.reference).toHaveLength(500);
    expect(JSON.stringify(data.scope)).toContain('[REDACTED]');
    expect(data.sources).toEqual([null, 1, true]);
  });
  it('rejects root clients and invalid events before persistence', async () => {
    const tx = transaction();
    await expect(
      appendAudit({ ...tx, $connect() {} } as never, event),
    ).rejects.toThrow('interactive');
    await expect(
      appendAudit(asTx(tx), { ...event, actor: { kind: 'STAFF', id: 'bad' } }),
    ).rejects.toThrow();
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });
  it('propagates persistence failure to the caller transaction', async () => {
    const tx = transaction();
    tx.auditEvent.create.mockRejectedValueOnce(new Error('write failed'));
    await expect(appendAudit(asTx(tx), event)).rejects.toThrow('write failed');
  });
});
describe('city counters', () => {
  it('uses atomic allocation and bigint results', async () => {
    const tx = transaction();
    expect(await allocateCitySequence(asTx(tx), id, 'VOLUNTEER')).toBe(1n);
    expect(tx.$queryRaw).toHaveBeenCalledOnce();
  });
  it('rejects root client, invalid scope, and absent result', async () => {
    const tx = transaction();
    await expect(
      allocateCitySequence({ ...tx, $connect() {} } as never, id, 'BRANCH'),
    ).rejects.toThrow('interactive');
    await expect(
      allocateCitySequence(asTx(tx), 'invalid', 'BRANCH'),
    ).rejects.toThrow();
    await expect(
      allocateCitySequence(asTx(tx), id, 'OTHER' as never),
    ).rejects.toThrow();
    tx.$queryRaw.mockResolvedValueOnce([]);
    await expect(allocateCitySequence(asTx(tx), id, 'BRANCH')).rejects.toThrow(
      'allocation failed',
    );
  });
});

describe('NUMERIC transport boundary', () => {
  it('accepts exact signed Decimal strings without float arithmetic', () => {
    expect(databaseMoney('-0.01').toFixed(2)).toBe('-0.01');
    expect(databaseMoney('9999999999999999.99').toFixed(2)).toBe(
      '9999999999999999.99',
    );
  });
  it.each([
    0.1,
    '1.001',
    'NaN',
    'Infinity',
    '1e2',
    '10000000000000000',
    ' 1.00',
    '01.00',
  ])('rejects noncanonical or unsupported money %s', (input) => {
    expect(() => databaseMoney(input)).toThrow();
  });
});
