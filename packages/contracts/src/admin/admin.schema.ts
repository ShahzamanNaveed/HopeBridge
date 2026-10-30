import { z } from 'zod';
import {
  staffRoleSchema,
  staffStatusSchema,
  credentialResetResponseSchema,
} from '../auth/auth.schema.js';

export const branchStatusSchema = z.enum([
  'FORMING',
  'ACTIVE',
  'PAUSED',
  'CLOSED',
]);
export const adminIdSchema = z.object({ id: z.uuid() }).strict();
export const adminListSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).default(''),
    role: staffRoleSchema.optional(),
    status: z.union([staffStatusSchema, branchStatusSchema]).optional(),
    branchId: z.uuid().optional(),
    domain: z
      .enum([
        'auth',
        'users',
        'branches',
        'applications',
        'members',
        'collections',
        'reports',
        'dashboard',
        'content',
        'audit',
      ])
      .optional(),
    action: z.string().trim().max(100).optional(),
    actorId: z.uuid().optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .strict()
  .refine((v) => !v.from || !v.to || v.from <= v.to, 'INVALID_DATE_RANGE');
export type AdminList = z.infer<typeof adminListSchema>;
export const staffListSchema = adminListSchema.safeExtend({
  status: staffStatusSchema.optional(),
});
export const branchListSchema = adminListSchema.safeExtend({
  status: branchStatusSchema.optional(),
  role: z.never().optional(),
});
export const auditListSchema = adminListSchema.safeExtend({
  status: z.never().optional(),
  role: z.never().optional(),
});
const name = z.string().trim().min(1).max(100);
export const staffCreateSchema = z
  .object({
    displayName: name,
    email: z.string().trim().email().toLowerCase().max(254),
    role: staffRoleSchema,
  })
  .strict();
export const staffUpdateSchema = staffCreateSchema
  .extend({
    version: z.number().int().nonnegative(),
    status: staffStatusSchema,
    replacementId: z.uuid().optional(),
  })
  .strict();
export const branchCreateSchema = z
  .object({
    name,
    address: z.string().trim().min(1).max(500),
    cityId: z.uuid(),
  })
  .strict();
export const branchUpdateSchema = branchCreateSchema
  .extend({
    version: z.number().int().nonnegative(),
  })
  .strict();
export const branchTransitionSchema = z
  .object({
    version: z.number().int().nonnegative(),
    status: branchStatusSchema,
  })
  .strict();
export const leadAssignSchema = z
  .object({
    version: z.number().int().nonnegative(),
    leadId: z.uuid(),
    expectedAssignmentId: z.uuid().nullable(),
  })
  .strict();
export type StaffCreate = z.infer<typeof staffCreateSchema>;
export type StaffUpdate = z.infer<typeof staffUpdateSchema>;
export type BranchCreate = z.infer<typeof branchCreateSchema>;
export type BranchUpdate = z.infer<typeof branchUpdateSchema>;
export type BranchTransition = z.infer<typeof branchTransitionSchema>;
export type LeadAssign = z.infer<typeof leadAssignSchema>;

export const staffRecordSchema = z.object({
  id: z.uuid(),
  email: z.string(),
  displayName: z.string(),
  role: staffRoleSchema,
  status: staffStatusSchema,
  version: z.number(),
  createdAt: z.iso.datetime(),
  branch: z
    .object({ id: z.uuid(), name: z.string(), code: z.string() })
    .nullable(),
});
export type StaffRecord = z.infer<typeof staffRecordSchema>;
export const staffProvisionResponseSchema =
  credentialResetResponseSchema.extend({ staff: staffRecordSchema });
export const cityRecordSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string(),
});
export const assignmentRecordSchema = z.object({
  id: z.uuid(),
  leadId: z.uuid(),
  leadName: z.string(),
  assignedById: z.uuid(),
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime().nullable(),
});
export const branchRecordSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  code: z.string(),
  address: z.string().nullable(),
  cityId: z.uuid(),
  city: cityRecordSchema,
  status: branchStatusSchema,
  version: z.number(),
  createdAt: z.iso.datetime(),
  currentLead: assignmentRecordSchema.nullable(),
});
export type BranchRecord = z.infer<typeof branchRecordSchema>;
export const auditRecordSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  actorId: z.uuid().nullable(),
  actor: z.string(),
  domain: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  branch: z
    .object({ id: z.uuid(), name: z.string(), code: z.string() })
    .nullable(),
  before: z.json().nullable(),
  after: z.json().nullable(),
  metadata: z.json().nullable(),
});
export type AuditRecord = z.infer<typeof auditRecordSchema>;
export const adminPageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  });
export const staffDetailSchema = z.object({
  staff: staffRecordSchema,
  history: z.array(auditRecordSchema),
});
export const branchDetailSchema = z.object({
  branch: branchRecordSchema,
  assignments: z.array(assignmentRecordSchema),
  history: z.array(auditRecordSchema),
});
export const adminOverviewSchema = z.object({
  totalBranches: z.number(),
  activeBranches: z.number(),
  activeStaff: z.number(),
  attentionBranches: z.number(),
  branchStatuses: z.array(
    z.object({ status: branchStatusSchema, count: z.number() }),
  ),
  staffRoles: z.array(z.object({ role: staffRoleSchema, count: z.number() })),
  recentActivity: z.array(auditRecordSchema),
  recentBranches: z.array(branchRecordSchema),
});
