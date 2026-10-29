import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../../src/generated/prisma/client.js';
import { appendAudit } from '../../src/modules/audit/audit.service.js';
import { allocateCitySequence } from '../../src/infrastructure/db/city-sequence.js';

// Only this independently created, randomly named DB is ever dropped. No reset,
// truncate, fixture deletion or schema changes against DATABASE_URL's database.
const testName = `hopebridge_db01_test_${randomUUID().replaceAll('-', '')}`;
let admin: pg.Client;
let db: PrismaClient;
let created = false;
let city: { id: string; code: string };
let branch: { id: string };
let staff: { id: string };
let hr: { id: string };
let finance: { id: string };
let counter = 100;
const week = new Date('2026-10-25T19:00:00Z');
const nextWeek = new Date('2026-11-01T19:00:00Z');
const systemEvent = {
  actor: { kind: 'SYSTEM' as const, name: 'db01-test' },
  domain: 'audit' as const,
  action: 'CHECK',
  entityType: 'test',
  entityId: 'synthetic',
};
const totals = {
  grossCollections: '10.01',
  recognizedAdjustments: '-0.01',
  netRecognized: '10.00',
  confirmedRemittances: '0.00',
  pendingReservations: '0.00',
  signedOutstanding: '10.00',
  reconciliationDeficit: '0.00',
  availableToRemit: '10.00',
};
beforeAll(async () => {
  if (!process.env.DATABASE_URL)
    throw new Error(
      'DATABASE_URL required; no database tests silently skipped',
    );
  const target = new URL(process.env.DATABASE_URL);
  if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(target.hostname))
    throw new Error(
      'Disposable DB tests require an explicitly local PostgreSQL server',
    );
  admin = new pg.Client({ connectionString: target.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${testName}"`);
  created = true;
  target.pathname = `/${testName}`;
  // Existing migration history + DB-01 replay from a completely empty DB.
  try {
    execFileSync(
      process.execPath,
      ['../../node_modules/prisma/build/index.js', 'migrate', 'deploy'],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: target.toString() },
        stdio: 'pipe',
      },
    );
  } catch (error) {
    const failure = error as { stderr?: Buffer; stdout?: Buffer };
    throw new Error(
      `Disposable migration replay failed: ${failure.stderr?.toString() ?? ''} ${failure.stdout?.toString() ?? ''}`,
      { cause: error },
    );
  }
  db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: target.toString(), max: 8 }),
  });
  expect(await db.staffUser.count()).toBe(0); // no privileged credential seed
  expect(await db.cmsItem.count()).toBe(7); // only safe fixed-page reference identities
  city = await db.city.create({
    data: { code: 'LHR', name: 'Synthetic Lahore' },
  });
  staff = await db.staffUser.create({
    data: {
      emailNormalized: 'admin@example.test',
      displayName: 'Synthetic admin',
      role: 'SUPER_ADMIN',
    },
  });
  hr = await db.staffUser.create({
    data: {
      emailNormalized: 'hr@example.test',
      displayName: 'Synthetic HR',
      role: 'HR_LEAD',
    },
  });
  finance = await db.staffUser.create({
    data: {
      emailNormalized: 'finance@example.test',
      displayName: 'Synthetic Finance',
      role: 'FINANCE_REVIEWER',
    },
  });
  branch = await activeBranch('LHR-001');
}, 60000);
afterAll(async () => {
  if (db) await db.$disconnect();
  if (created && /^hopebridge_db01_test_[a-f0-9]{32}$/.test(testName))
    await admin.query(`DROP DATABASE "${testName}"`);
  if (admin) await admin.end();
}, 30000);
async function activeBranch(code: string) {
  const lead = await db.staffUser.create({
    data: {
      emailNormalized: `${randomUUID()}@example.test`,
      displayName: 'Synthetic lead',
      role: 'BRANCH_LEAD',
    },
  });
  return db.$transaction(async (tx) => {
    const b = await tx.branch.create({
      data: { code, name: 'Synthetic branch', cityId: city.id },
    });
    await tx.branchLeadAssignment.create({
      data: { branchId: b.id, leadId: lead.id, assignedById: staff.id },
    });
    return tx.branch.update({
      where: { id: b.id },
      data: { status: 'ACTIVE' },
    });
  });
}
async function application(b = branch.id) {
  const n = ++counter;
  return db.volunteerApplication.create({
    data: {
      reference: `TEST-APP-${n}`,
      fullName: 'Synthetic volunteer',
      emailNormalized: `volunteer${n}@example.test`,
      phoneNormalized: `+923${String(n).padStart(9, '0')}`,
      residentialCity: 'Different residential city',
      preferredBranchId: b,
      areaOfInterest: 'Education Support',
      motivation: 'Synthetic test motivation for local database verification.',
      consentVersion: 'synthetic-v1',
    },
  });
}
async function member() {
  const a = await application();
  return db.$transaction(async (tx) => {
    const n = await allocateCitySequence(tx, city.id, 'VOLUNTEER');
    const m = await tx.member.create({
      data: {
        applicationId: a.id,
        branchId: branch.id,
        originCityId: city.id,
        volunteerId: `LHR-V${String(n).padStart(4, '0')}`,
        fullName: a.fullName,
        emailNormalized: a.emailNormalized,
        phoneNormalized: a.phoneNormalized,
      },
    });
    await tx.volunteerApplication.update({
      where: { id: a.id },
      data: { status: 'ACCEPTED' },
    });
    return m;
  });
}
async function collection(b = branch.id) {
  return db.collection.create({
    data: {
      branchId: b,
      reference: randomUUID(),
      amount: '10.01',
      occurredAt: new Date('2026-10-27T10:00:00Z'),
      recordedById: staff.id,
    },
  });
}
async function report(b = branch.id, start = week) {
  return db.weeklyReport.create({
    data: {
      branchId: b,
      weekStart: start,
      weekEnd: new Date(start.getTime() + 7 * 86400000),
    },
  });
}
async function remittance() {
  return db.$transaction(async (tx) => {
    const r = await tx.remittance.create({
      data: {
        branchId: branch.id,
        amount: '3.01',
        reference: randomUUID(),
        transferDate: new Date('2026-10-28'),
        recordedById: staff.id,
      },
    });
    await tx.remittanceReservation.create({
      data: { remittanceId: r.id, amount: r.amount },
    });
    return r;
  });
}

describe('shared PostgreSQL schema, replayed on a disposable database', () => {
  it('creates every mapped table and foreign key graph without business fixtures', async () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    const tables = [...schema.matchAll(/@@map\("([^"\n]+)"\)/g)].map(
      (m) => m[1],
    );
    const actual = await db.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    expect(actual.map((t) => t.tablename)).toEqual(
      expect.arrayContaining(tables),
    );
    const fks = await db.$queryRaw<
      { count: bigint }[]
    >`SELECT count(*) FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace`;
    expect(Number(fks[0]?.count)).toBeGreaterThan(50);
  });
  it('enforces role enum, normalized staff identity and secure temporary/session state', async () => {
    await expect(
      db.$executeRaw`INSERT INTO staff_users(email_normalized,display_name,role) VALUES ('bad@example.test','test','VOLUNTEER')`,
    ).rejects.toThrow();
    await expect(
      db.staffUser.create({
        data: {
          emailNormalized: 'NotNormalized@EXAMPLE.test',
          displayName: 'test',
          role: 'HR_LEAD',
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.staffCredential.create({
        data: {
          staffId: hr.id,
          passwordHash: 'plaintext',
          mustChangePassword: true,
        },
      }),
    ).rejects.toThrow();
    const issued = new Date();
    await db.staffCredential.create({
      data: {
        staffId: hr.id,
        passwordHash: '$argon2id$synthetic-test-hash-not-a-login',
        temporaryIssuedAt: issued,
        temporaryExpiresAt: new Date(+issued + 86400000),
      },
    });
    await expect(
      db.staffSession.create({
        data: {
          staffId: hr.id,
          tokenHash: randomUUID(),
          csrfTokenHash: randomUUID(),
          issuedAt: issued,
          absoluteExpiresAt: new Date(+issued + 25 * 3600000),
          idleExpiresAt: new Date(+issued + 3600000),
          lastActivityAt: issued,
        },
      }),
    ).rejects.toThrow();
  });
  it('protects final active admin and requires a lead before activation', async () => {
    await expect(
      db.staffUser.update({
        where: { id: staff.id },
        data: { status: 'INACTIVE' },
      }),
    ).rejects.toThrow();
    const b = await db.branch.create({
      data: { code: 'LHR-NO-LEAD', name: 'forming', cityId: city.id },
    });
    await expect(
      db.branch.update({ where: { id: b.id }, data: { status: 'ACTIVE' } }),
    ).rejects.toThrow();
  });
  it('enforces immutable globally unique branch codes and current lead uniqueness', async () => {
    await expect(
      db.branch.create({
        data: { code: 'FSD-WRONG-CITY', name: 'bad prefix', cityId: city.id },
      }),
    ).rejects.toThrow();
    await expect(
      db.branch.create({
        data: { code: 'LHR-001', name: 'duplicate', cityId: city.id },
      }),
    ).rejects.toThrow();
    await expect(
      db.branch.update({ where: { id: branch.id }, data: { code: 'CHANGED' } }),
    ).rejects.toThrow();
    await expect(
      db.branch.delete({ where: { id: branch.id } }),
    ).rejects.toThrow();
    const current = await db.branchLeadAssignment.findFirstOrThrow({
      where: { branchId: branch.id, endedAt: null },
    });
    const b = await db.branch.create({
      data: { code: 'LHR-002', name: 'forming', cityId: city.id },
    });
    await expect(
      db.branchLeadAssignment.create({
        data: {
          branchId: b.id,
          leadId: current.leadId,
          assignedById: staff.id,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.branchLeadAssignment.update({
        where: { id: current.id },
        data: { endedAt: new Date() },
      }),
    ).rejects.toThrow();
  });
  it('allocates independent city sequences safely under concurrency and rollback', async () => {
    const values = await Promise.all(
      Array.from({ length: 8 }, () =>
        db.$transaction((tx) => allocateCitySequence(tx, city.id, 'BRANCH')),
      ),
    );
    expect(new Set(values).size).toBe(8);
    expect(values.toSorted((a, b) => Number(a - b))).toEqual([
      1n,
      2n,
      3n,
      4n,
      5n,
      6n,
      7n,
      8n,
    ]);
    const other = await db.city.create({
      data: { code: 'FSD', name: 'Synthetic Faisalabad' },
    });
    expect(
      await db.$transaction((tx) =>
        allocateCitySequence(tx, other.id, 'BRANCH'),
      ),
    ).toBe(1n);
    await expect(
      db.$transaction(async (tx) => {
        await allocateCitySequence(tx, other.id, 'VOLUNTEER');
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(
      await db.cityCounter.findUnique({
        where: { cityId_kind: { cityId: other.id, kind: 'VOLUNTEER' } },
      }),
    ).toBeNull();
  });
  it('serializes exact contact duplicates, permits Declined reapplication and validates fields/branch', async () => {
    const a = await application();
    await expect(
      db.volunteerApplication.create({
        data: {
          reference: randomUUID(),
          fullName: a.fullName,
          emailNormalized: a.emailNormalized,
          phoneNormalized: '+923999999991',
          residentialCity: 'test',
          preferredBranchId: branch.id,
          areaOfInterest: 'test',
          motivation: a.motivation,
          consentVersion: 'v1',
        },
      }),
    ).rejects.toThrow();
    await db.volunteerApplication.update({
      where: { id: a.id },
      data: { status: 'DECLINED', declineReason: 'Synthetic decline' },
    });
    const copy = {
      fullName: a.fullName,
      emailNormalized: a.emailNormalized,
      phoneNormalized: a.phoneNormalized,
      residentialCity: 'test',
      preferredBranchId: branch.id,
      areaOfInterest: 'test',
      motivation: a.motivation,
      consentVersion: 'v1',
    };
    const races = await Promise.allSettled([
      db.volunteerApplication.create({
        data: { ...copy, reference: randomUUID() },
      }),
      db.volunteerApplication.create({
        data: { ...copy, reference: randomUUID() },
      }),
    ]);
    expect(races.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const forming = await db.branch.findFirstOrThrow({
      where: { code: 'LHR-NO-LEAD' },
    });
    await expect(application(forming.id)).rejects.toThrow();
    await expect(
      db.volunteerApplication.update({
        where: { id: a.id },
        data: { motivation: 'short' },
      }),
    ).rejects.toThrow();
  });
  it('links exactly one permanent city member and blocks Accepted without linkage', async () => {
    const a = await application();
    await expect(
      db.volunteerApplication.update({
        where: { id: a.id },
        data: { status: 'ACCEPTED' },
      }),
    ).rejects.toThrow();
    const m = await member();
    await expect(
      db.member.update({
        where: { id: m.id },
        data: { volunteerId: 'FSD-V9000' },
      }),
    ).rejects.toThrow();
    await expect(
      db.member.create({
        data: {
          applicationId: m.applicationId,
          branchId: m.branchId,
          originCityId: city.id,
          volunteerId: 'LHR-V9000',
          fullName: 'test',
          emailNormalized: 'another@example.test',
          phoneNormalized: '+923999999990',
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.member.create({
        data: {
          applicationId: a.id,
          branchId: m.branchId,
          originCityId: city.id,
          volunteerId: m.volunteerId,
          fullName: 'test',
          emailNormalized: a.emailNormalized,
          phoneNormalized: a.phoneNormalized,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.volunteerApplication.create({
        data: {
          reference: randomUUID(),
          fullName: m.fullName,
          emailNormalized: m.emailNormalized,
          phoneNormalized: '+923999999989',
          residentialCity: 'test',
          preferredBranchId: m.branchId,
          areaOfInterest: 'test',
          motivation: 'Synthetic motivation for duplicate member check.',
          consentVersion: 'v1',
        },
      }),
    ).rejects.toThrow();
  });
  it('serializes competing cross-table member activation and public intake', async () => {
    const m = await member();
    await db.member.update({
      where: { id: m.id },
      data: { status: 'INACTIVE' },
    });
    const results = await Promise.allSettled([
      db.member.update({ where: { id: m.id }, data: { status: 'ACTIVE' } }),
      db.volunteerApplication.create({
        data: {
          reference: randomUUID(),
          fullName: 'Synthetic applicant',
          emailNormalized: m.emailNormalized,
          phoneNormalized: m.phoneNormalized,
          residentialCity: 'test',
          preferredBranchId: branch.id,
          areaOfInterest: 'test',
          motivation: 'Synthetic cross-table concurrency verification.',
          consentVersion: 'v1',
        },
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
  it('preserves assignment start/end and same-member reactivation identity', async () => {
    const m = await member();
    const team = await db.team.create({
      data: { branchId: branch.id, name: 'Synthetic team' },
    });
    const a = await db.memberAssignment.create({
      data: { memberId: m.id, teamId: team.id, assignedById: staff.id },
    });
    await expect(
      db.member.update({ where: { id: m.id }, data: { status: 'INACTIVE' } }),
    ).rejects.toThrow();
    await db.$transaction(async (tx) => {
      await tx.memberAssignment.update({
        where: { id: a.id },
        data: { endedAt: new Date(), endReason: 'synthetic reversal' },
      });
      await tx.member.update({
        where: { id: m.id },
        data: { status: 'INACTIVE' },
      });
      await tx.volunteerApplication.update({
        where: { id: m.applicationId },
        data: { status: 'PENDING' },
      });
      await appendAudit(tx, { ...systemEvent, entityId: m.id });
    });
    await expect(
      db.memberAssignment.create({
        data: { memberId: m.id, teamId: team.id, assignedById: staff.id },
      }),
    ).rejects.toThrow();
    await db.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: m.id },
        data: { status: 'ACTIVE' },
      });
      await tx.volunteerApplication.update({
        where: { id: m.applicationId },
        data: { status: 'ACCEPTED' },
      });
    });
    expect(
      (await db.member.findUniqueOrThrow({ where: { id: m.id } })).volunteerId,
    ).toBe(m.volunteerId);
    expect(
      (await db.memberAssignment.findUniqueOrThrow({ where: { id: a.id } }))
        .startedAt,
    ).toEqual(a.startedAt);
    expect(
      await db.memberAssignment.count({
        where: { memberId: m.id, endedAt: null },
      }),
    ).toBe(0);
    await expect(
      db.memberAssignment.update({
        where: { id: a.id },
        data: { endedAt: null },
      }),
    ).rejects.toThrow();
  });
  it('persists optional transfer reason without inventing consent or approval workflow', async () => {
    const m = await member();
    const target = await activeBranch('LHR-TRANSFER');
    const transfer = await db.memberTransfer.create({
      data: {
        memberId: m.id,
        sourceBranchId: branch.id,
        targetBranchId: target.id,
        requestedById: staff.id,
      },
    });
    expect(transfer.status).toBe('PENDING');
    await db.memberHistory.create({
      data: {
        memberId: m.id,
        actorId: hr.id,
        action: 'TEST_HISTORY',
        previousBranchId: branch.id,
        newBranchId: target.id,
      },
    });
    await expect(
      db.memberHistory.create({
        data: {
          memberId: m.id,
          actorId: hr.id,
          action: 'INVALID_HISTORY',
          previousBranchId: randomUUID(),
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.memberTransfer.update({
        where: { id: transfer.id },
        data: { targetBranchId: branch.id },
      }),
    ).rejects.toThrow();
  });
  it('preserves exact Decimal values, occurrence week/server-created timestamp and locks', async () => {
    const c = await collection();
    expect(c.amount.toFixed(2)).toBe('10.01');
    expect(c.originalWeekStart).toEqual(week);
    expect(new Prisma.Decimal('0.10').plus('0.20').toFixed(2)).toBe('0.30');
    await expect(
      db.collection.update({
        where: { id: c.id },
        data: { createdAt: new Date('2020-01-01') },
      }),
    ).rejects.toThrow();
    await expect(
      db.collection.update({ where: { id: c.id }, data: { amount: '-1.00' } }),
    ).rejects.toThrow();
    await expect(
      db.$executeRaw`UPDATE collections SET amount='NaN'::numeric WHERE id=${c.id}::uuid`,
    ).rejects.toThrow();
    await expect(
      db.collection.update({
        where: { id: c.id },
        data: { amount: '10000000000000000.00' },
      }),
    ).rejects.toThrow();
    const inactive = await member();
    await db.member.update({
      where: { id: inactive.id },
      data: { status: 'INACTIVE' },
    });
    await expect(
      db.collection.update({
        where: { id: c.id },
        data: { memberId: inactive.id },
      }),
    ).rejects.toThrow();
    // Privileged fixture aging ONLY in this disposable DB, never in application code/dev DB.
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        'ALTER TABLE collections DISABLE TRIGGER collection_guard',
      );
      await tx.$executeRaw`UPDATE collections SET created_at=now()-interval '168 hours' WHERE id=${c.id}::uuid`;
      await tx.$executeRawUnsafe(
        'ALTER TABLE collections ENABLE TRIGGER collection_guard',
      );
    });
    await expect(
      db.collection.update({ where: { id: c.id }, data: { amount: '9.00' } }),
    ).rejects.toThrow();
  });
  it('enforces branch/week uniqueness and original/Late Entry recognition uniqueness', async () => {
    const w = await report();
    const c = await collection();
    await expect(report()).rejects.toThrow();
    await expect(
      report(branch.id, new Date('2026-10-26T00:00:00Z')),
    ).rejects.toThrow();
    await db.financialRecognition.create({
      data: {
        branchId: branch.id,
        reportId: w.id,
        collectionId: c.id,
        kind: 'ORIGINAL',
      },
    });
    await expect(
      db.financialRecognition.create({
        data: {
          branchId: branch.id,
          reportId: w.id,
          collectionId: c.id,
          kind: 'ORIGINAL',
        },
      }),
    ).rejects.toThrow();
    const b = await activeBranch('LHR-REPORT-OTHER');
    const other = await report(b.id);
    await expect(
      db.financialRecognition.create({
        data: {
          branchId: b.id,
          reportId: other.id,
          collectionId: c.id,
          kind: 'ORIGINAL',
        },
      }),
    ).rejects.toThrow();
    await db.weeklyReport.update({
      where: { id: w.id },
      data: { status: 'SUBMITTED' },
    });
    await expect(
      db.collection.update({ where: { id: c.id }, data: { amount: '9.00' } }),
    ).rejects.toThrow();
  });
  it('permits sequential corrections but one pending review and nonnegative cumulative corrected value', async () => {
    const c = await collection();
    const pending = await db.financialAdjustment.create({
      data: {
        branchId: branch.id,
        collectionId: c.id,
        reference: randomUUID(),
        amount: '-0.01',
        reason: 'synthetic correction',
        requestedById: staff.id,
      },
    });
    await expect(
      db.financialAdjustment.update({
        where: { id: pending.id },
        data: { reference: randomUUID() },
      }),
    ).rejects.toThrow();
    await expect(
      db.financialAdjustment.create({
        data: {
          branchId: branch.id,
          collectionId: c.id,
          reference: randomUUID(),
          amount: '-0.02',
          reason: 'synthetic',
          requestedById: staff.id,
        },
      }),
    ).rejects.toThrow();
    await db.financialAdjustment.update({
      where: { id: pending.id },
      data: {
        status: 'APPROVED',
        decidedById: finance.id,
        decidedAt: new Date(),
      },
    });
    const second = await db.financialAdjustment.create({
      data: {
        branchId: branch.id,
        collectionId: c.id,
        reference: randomUUID(),
        amount: '-11.00',
        reason: 'synthetic sequential',
        requestedById: staff.id,
      },
    });
    await expect(
      db.financialAdjustment.update({
        where: { id: second.id },
        data: {
          status: 'APPROVED',
          decidedById: finance.id,
          decidedAt: new Date(),
        },
      }),
    ).rejects.toThrow();
    await db.financialAdjustment.update({
      where: { id: second.id },
      data: {
        status: 'REJECTED',
        decidedById: finance.id,
        decidedAt: new Date(),
      },
    });
    const w = await report(branch.id, nextWeek);
    await db.financialRecognition.create({
      data: {
        branchId: branch.id,
        reportId: w.id,
        adjustmentId: pending.id,
        kind: 'ADJUSTMENT',
      },
    });
    await expect(
      db.financialRecognition.create({
        data: {
          branchId: branch.id,
          reportId: w.id,
          adjustmentId: pending.id,
          kind: 'ADJUSTMENT',
        },
      }),
    ).rejects.toThrow();
  });
  it('keeps remittance reservations atomic and releases each at most once', async () => {
    const r = await remittance();
    const cancellation = await db.remittanceCancellation.create({
      data: { remittanceId: r.id, requestedById: staff.id },
    });
    await expect(
      db.remittanceCancellation.create({
        data: { remittanceId: r.id, requestedById: staff.id },
      }),
    ).rejects.toThrow();
    await expect(
      db.remittanceCancellation.update({
        where: { id: cancellation.id },
        data: {
          status: 'APPROVED',
          decidedById: finance.id,
          decidedAt: new Date(),
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.remittanceReservation.create({
        data: { remittanceId: r.id, amount: '3.01' },
      }),
    ).rejects.toThrow();
    await expect(
      db.remittanceReservation.update({
        where: { remittanceId: r.id },
        data: { state: 'RELEASED', settledAt: new Date() },
      }),
    ).rejects.toThrow();
    await db.$transaction(async (tx) => {
      await tx.remittance.update({
        where: { id: r.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      await tx.remittanceReservation.update({
        where: { remittanceId: r.id },
        data: { state: 'RELEASED', settledAt: new Date() },
      });
      await tx.remittanceCancellation.update({
        where: { id: cancellation.id },
        data: {
          status: 'APPROVED',
          decidedById: finance.id,
          decidedAt: new Date(),
        },
      });
    });
    await expect(
      db.remittanceReservation.update({
        where: { remittanceId: r.id },
        data: { state: 'RESERVED', settledAt: null },
      }),
    ).rejects.toThrow();
    await expect(
      db.remittance.update({
        where: { id: r.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
          confirmedById: finance.id,
          cancelledAt: null,
        },
      }),
    ).rejects.toThrow();
  });
  it('preserves frozen revisions, final snapshot/approval and return reasons', async () => {
    const w = await db.weeklyReport.findUniqueOrThrow({
      where: { branchId_weekStart: { branchId: branch.id, weekStart: week } },
    });
    const recognition = await db.financialRecognition.findFirstOrThrow({
      where: { reportId: w.id, kind: 'ORIGINAL' },
    });
    const original = await db.collection.findUniqueOrThrow({
      where: { id: recognition.collectionId! },
    });
    const revision = await db.$transaction(async (tx) => {
      const r = await tx.reportRevision.create({
        data: { reportId: w.id, number: 1, submittedById: staff.id, ...totals },
      });
      await tx.reportLine.create({
        data: {
          revisionId: r.id,
          recognitionId: recognition.id,
          kind: 'ORIGINAL',
          amount: original.amount,
          sourceOccurredAt: original.occurredAt,
          originalWeekStart: original.originalWeekStart,
        },
      });
      return r;
    });
    await expect(
      db.reportLine.create({
        data: {
          revisionId: revision.id,
          recognitionId: recognition.id,
          kind: 'ORIGINAL',
          amount: '99.00',
          sourceOccurredAt: original.occurredAt,
          originalWeekStart: original.originalWeekStart,
        },
      }),
    ).rejects.toThrow();
    await expect(
      db.reportRevision.update({
        where: { id: revision.id },
        data: { grossCollections: '99.00' },
      }),
    ).rejects.toThrow();
    await db.$transaction(async (tx) => {
      const at = new Date();
      await tx.reportApproval.create({
        data: {
          reportId: w.id,
          revisionId: revision.id,
          approvedById: finance.id,
          approvedAt: at,
        },
      });
      await tx.weeklyReport.update({
        where: { id: w.id },
        data: { status: 'APPROVED', approvedAt: at, lockedAt: at },
      });
    });
    await expect(
      db.weeklyReport.update({
        where: { id: w.id },
        data: { status: 'RETURNED', approvedAt: null, lockedAt: null },
      }),
    ).rejects.toThrow();
    const audit = await db.$transaction((tx) => appendAudit(tx, systemEvent));
    await expect(
      db.reportTransition.create({
        data: {
          reportId: w.id,
          action: 'RETURN',
          fromStatus: 'SUBMITTED',
          toStatus: 'RETURNED',
          reportVersion: 1,
          reason: '   ',
          auditId: audit.id,
        },
      }),
    ).rejects.toThrow();
  });
  it('supports fixed bilingual CMS revisions/publication while preserving history', async () => {
    const item = await db.cmsItem.findUniqueOrThrow({
      where: { page: 'HOME' },
    });
    const draft = await db.cmsRevision.create({
      data: { itemId: item.id, number: 1, editedById: staff.id },
    });
    await expect(
      db.cmsRevision.update({
        where: { id: draft.id },
        data: {
          status: 'PUBLISHED',
          publishedById: staff.id,
          publishedAt: new Date(),
          sanitizedAt: new Date(),
        },
      }),
    ).rejects.toThrow();
    await db.cmsRevision.update({
      where: { id: draft.id },
      data: {
        titleEn: 'Synthetic',
        titleUr: '??????',
        bodyEn: 'Safe synthetic content',
        bodyUr: '?????? ????',
        status: 'PUBLISHED',
        publishedById: staff.id,
        publishedAt: new Date(),
        sanitizedAt: new Date(),
      },
    });
    await db.cmsPublication.create({
      data: { itemId: item.id, revisionId: draft.id },
    });
    await db.cmsRevision.create({
      data: {
        itemId: item.id,
        number: 2,
        editedById: staff.id,
        titleEn: 'New incomplete draft',
      },
    });
    expect(
      (
        await db.cmsPublication.findUniqueOrThrow({
          where: { itemId: item.id },
        })
      ).revisionId,
    ).toBe(draft.id);
    await expect(
      db.cmsRevision.update({
        where: { id: draft.id },
        data: { titleEn: 'rewrite' },
      }),
    ).rejects.toThrow();
    await expect(
      db.cmsItem.update({
        where: { id: item.id },
        data: { slug: 'remove-home' },
      }),
    ).rejects.toThrow();
    await expect(
      db.cmsItem.update({
        where: { id: item.id },
        data: { archivedAt: new Date() },
      }),
    ).rejects.toThrow();
    await db.$transaction(async (tx) => {
      await tx.cmsPublication.delete({ where: { itemId: item.id } });
      await tx.cmsItem.update({
        where: { id: item.id },
        data: { archivedAt: new Date() },
      });
    });
    expect(await db.cmsRevision.count({ where: { itemId: item.id } })).toBe(2);
    const event = await db.cmsItem.create({
      data: { kind: 'EVENT', slug: 'synthetic-event' },
    });
    await expect(
      db.cmsRevision.create({
        data: {
          itemId: event.id,
          number: 1,
          editedById: staff.id,
          startsAt: week,
          endsAt: week,
        },
      }),
    ).rejects.toThrow();
  });
  it('recognizes a late original once without rewriting its locked occurrence week', async () => {
    const c = await collection();
    const next = await db.weeklyReport.findUniqueOrThrow({
      where: {
        branchId_weekStart: { branchId: branch.id, weekStart: nextWeek },
      },
    });
    const races = await Promise.allSettled(
      [0, 1].map(() =>
        db.financialRecognition.create({
          data: {
            branchId: branch.id,
            reportId: next.id,
            collectionId: c.id,
            kind: 'LATE_ENTRY',
          },
        }),
      ),
    );
    expect(races.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      (await db.collection.findUniqueOrThrow({ where: { id: c.id } }))
        .originalWeekStart,
    ).toEqual(week);
  });
  it('publishes complete Program/Event revisions with optional images and required bilingual fields', async () => {
    const data = {
      number: 1,
      editedById: staff.id,
      titleEn: 'Synthetic',
      titleUr: '??????',
      bodyEn: 'Synthetic body',
      bodyUr: '?????? ????',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
      publishedById: staff.id,
      sanitizedAt: new Date(),
    };
    const program = await db.cmsItem.create({
      data: { kind: 'PROGRAM', slug: 'synthetic-program' },
    });
    await expect(
      db.cmsRevision.create({ data: { ...data, itemId: program.id } }),
    ).rejects.toThrow();
    const p = await db.cmsRevision.create({
      data: {
        ...data,
        itemId: program.id,
        summaryEn: 'Summary',
        summaryUr: '?????',
      },
    });
    expect(p.imageId).toBeNull();
    const event = await db.cmsItem.create({
      data: { kind: 'EVENT', slug: 'complete-event' },
    });
    const e = await db.cmsRevision.create({
      data: {
        ...data,
        itemId: event.id,
        startsAt: week,
        endsAt: nextWeek,
        location: 'Synthetic venue',
      },
    });
    expect(e.endsAt).toEqual(nextWeek);
    await expect(
      db.cmsPublication.create({
        data: { itemId: event.id, revisionId: p.id },
      }),
    ).rejects.toThrow();
  });
  it('atomically replaces the assigned lead and preserves old assignment/session history', async () => {
    const old = await db.branchLeadAssignment.findFirstOrThrow({
      where: { branchId: branch.id, endedAt: null },
    });
    const replacement = await db.staffUser.create({
      data: {
        emailNormalized: 'replacement@example.test',
        displayName: 'Synthetic replacement',
        role: 'BRANCH_LEAD',
      },
    });
    const at = new Date();
    const session = await db.staffSession.create({
      data: {
        staffId: old.leadId,
        tokenHash: randomUUID(),
        csrfTokenHash: randomUUID(),
        issuedAt: at,
        absoluteExpiresAt: new Date(+at + 86400000),
        idleExpiresAt: new Date(+at + 3600000),
        lastActivityAt: at,
      },
    });
    await db.$transaction(async (tx) => {
      await tx.branchLeadAssignment.update({
        where: { id: old.id },
        data: { endedAt: at },
      });
      await tx.branchLeadAssignment.create({
        data: {
          branchId: branch.id,
          leadId: replacement.id,
          assignedById: staff.id,
        },
      });
      await tx.staffSession.update({
        where: { id: session.id },
        data: { revokedAt: at },
      });
      await tx.staffUser.update({
        where: { id: old.leadId },
        data: { status: 'INACTIVE', deactivatedAt: at },
      });
      await appendAudit(tx, {
        ...systemEvent,
        branchId: branch.id,
        entityId: old.id,
        action: 'LEAD_REPLACED',
      });
    });
    expect(
      (
        await db.branchLeadAssignment.findUniqueOrThrow({
          where: { id: old.id },
        })
      ).startedAt,
    ).toEqual(old.startedAt);
    expect(
      (await db.staffSession.findUniqueOrThrow({ where: { id: session.id } }))
        .revokedAt,
    ).toEqual(at);
    await expect(
      db.staffSession.update({
        where: { id: session.id },
        data: { revokedAt: null },
      }),
    ).rejects.toThrow();
    expect(
      await db.branchLeadAssignment.count({
        where: { branchId: branch.id, endedAt: null },
      }),
    ).toBe(1);
  });
  it('persists sanitized staff/system audit and rolls back business writes when audit fails', async () => {
    const before = await db.city.count();
    await expect(
      db.$transaction(async (tx) => {
        await tx.city.create({ data: { code: 'ROLLBACK', name: 'Synthetic' } });
        await appendAudit(tx, {
          ...systemEvent,
          actor: { kind: 'STAFF', id: randomUUID() },
        });
      }),
    ).rejects.toThrow();
    expect(await db.city.count()).toBe(before);
    const result = await db.$transaction(async (tx) => {
      await tx.city.create({ data: { code: 'AUDITED', name: 'Synthetic' } });
      return appendAudit(tx, {
        ...systemEvent,
        actor: { kind: 'STAFF', id: hr.id },
        branchId: branch.id,
        before: { status: 'PENDING', password: 'secret', email: 'private' },
        after: { status: 'ACCEPTED' },
      });
    });
    const row = await db.auditEvent.findUniqueOrThrow({
      where: { id: result.id },
    });
    expect(row.actorId).toBe(hr.id);
    expect(JSON.stringify(row)).not.toContain('secret');
    expect(row.before).toEqual({
      status: 'PENDING',
      password: '[REDACTED]',
      email: '[REDACTED]',
    });
    await expect(
      db.auditEvent.update({
        where: { id: result.id },
        data: { action: 'tampered' },
      }),
    ).rejects.toThrow();
    await expect(
      db.auditEvent.delete({ where: { id: result.id } }),
    ).rejects.toThrow();
    await expect(
      db.$executeRawUnsafe('TRUNCATE audit_events CASCADE'),
    ).rejects.toThrow();
    const id = randomUUID();
    await expect(
      db.$transaction(async (tx) => {
        await appendAudit(tx, { ...systemEvent, entityId: id });
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
    expect(await db.auditEvent.count({ where: { entityId: id } })).toBe(0);
  });
});
