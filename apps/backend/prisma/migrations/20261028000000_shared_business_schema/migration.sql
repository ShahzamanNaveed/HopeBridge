BEGIN;
-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('SUPER_ADMIN', 'FINANCE_REVIEWER', 'CONTENT_EDITOR', 'BRANCH_LEAD', 'HR_LEAD');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('FORMING', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ApplicationDecisionType" AS ENUM ('ACCEPT', 'DECLINE', 'REVERSE_ACCEPTANCE', 'REVERSE_DECLINE', 'REACCEPT');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RecognitionKind" AS ENUM ('ORIGINAL', 'LATE_ENTRY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "RemittanceStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationState" AS ENUM ('RESERVED', 'CONFIRMED', 'RELEASED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'RETURNED', 'APPROVED');

-- CreateEnum
CREATE TYPE "ReportAction" AS ENUM ('GENERATE', 'SUBMIT', 'RETURN', 'RESUBMIT', 'APPROVE');

-- CreateEnum
CREATE TYPE "ContentKind" AS ENUM ('PROGRAM', 'EVENT', 'PAGE');

-- CreateEnum
CREATE TYPE "ContentRevisionStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PublicPage" AS ENUM ('HOME', 'ABOUT', 'PROGRAMS', 'BRANCHES', 'EVENTS', 'GET_INVOLVED', 'CONTACT');

-- CreateEnum
CREATE TYPE "AuditActorKind" AS ENUM ('STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CredentialEventType" AS ENUM ('PROVISION', 'RESET', 'CHANGE', 'EXPIRE');

-- CreateEnum
CREATE TYPE "CitySequenceKind" AS ENUM ('BRANCH', 'VOLUNTEER');

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city_counters" (
    "city_id" UUID NOT NULL,
    "kind" "CitySequenceKind" NOT NULL,
    "value" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "city_counters_pkey" PRIMARY KEY ("city_id","kind")
);

-- CreateTable
CREATE TABLE "staff_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_normalized" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "deactivated_at" TIMESTAMPTZ(3),

    CONSTRAINT "staff_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_credentials" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password_hash" TEXT NOT NULL,
    "temporary_issued_at" TIMESTAMPTZ(3),
    "temporary_expires_at" TIMESTAMPTZ(3),
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "changed_at" TIMESTAMPTZ(3),
    "staff_id" UUID NOT NULL,

    CONSTRAINT "staff_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "token_hash" TEXT NOT NULL,
    "csrf_token_hash" TEXT NOT NULL,
    "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "absolute_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "idle_expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "last_activity_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staff_id" UUID NOT NULL,

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "CredentialEventType" NOT NULL,
    "metadata" JSONB,
    "staff_id" UUID NOT NULL,
    "actor_id" UUID,

    CONSTRAINT "credential_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "status" "BranchStatus" NOT NULL DEFAULT 'FORMING',
    "version" INTEGER NOT NULL DEFAULT 0,
    "city_id" UUID NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_lead_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "branch_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "assigned_by_id" UUID NOT NULL,

    CONSTRAINT "branch_lead_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "phone_normalized" TEXT NOT NULL,
    "residential_city" TEXT NOT NULL,
    "area_of_interest" TEXT NOT NULL,
    "motivation" TEXT NOT NULL,
    "availability" TEXT,
    "consent_version" TEXT NOT NULL,
    "consent_accepted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "decline_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "preferred_branch_id" UUID NOT NULL,

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "ApplicationDecisionType" NOT NULL,
    "from_status" "ApplicationStatus" NOT NULL,
    "to_status" "ApplicationStatus" NOT NULL,
    "reason" TEXT,
    "application_version" INTEGER NOT NULL,
    "application_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,

    CONSTRAINT "application_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "recipient_email" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3),
    "last_error_code" TEXT,
    "decision_id" UUID NOT NULL,

    CONSTRAINT "decision_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "volunteer_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email_normalized" TEXT NOT NULL,
    "phone_normalized" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "application_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "origin_city_id" UUID NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "previous_branch_id" UUID,
    "previous_status" "MemberStatus",
    "new_status" "MemberStatus",
    "reason" TEXT,
    "member_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,

    CONSTRAINT "member_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "archived_at" TIMESTAMPTZ(3),
    "branch_id" UUID NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operational_role" TEXT,
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "end_reason" TEXT,
    "member_id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "assigned_by_id" UUID NOT NULL,

    CONSTRAINT "member_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_transfers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "decision_reason" TEXT,
    "decided_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "member_id" UUID NOT NULL,
    "source_branch_id" UUID NOT NULL,
    "target_branch_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "decided_by_id" UUID,

    CONSTRAINT "member_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storage_key" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "content_hash" TEXT NOT NULL,
    "validated_at" TIMESTAMPTZ(3),
    "alt_en" TEXT,
    "alt_ur" TEXT,
    "uploaded_by_id" UUID NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "original_week_start" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,
    "branch_id" UUID NOT NULL,
    "member_id" UUID,
    "recorded_by_id" UUID NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_adjustments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "decision_reason" TEXT,
    "decided_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "branch_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "decided_by_id" UUID,
    "evidence_id" UUID,

    CONSTRAINT "financial_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "week_start" TIMESTAMPTZ(3) NOT NULL,
    "week_end" TIMESTAMPTZ(3) NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 0,
    "approved_at" TIMESTAMPTZ(3),
    "locked_at" TIMESTAMPTZ(3),
    "branch_id" UUID NOT NULL,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_recognitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "RecognitionKind" NOT NULL,
    "recognized_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "branch_id" UUID NOT NULL,
    "collection_id" UUID,
    "adjustment_id" UUID,
    "report_id" UUID NOT NULL,

    CONSTRAINT "financial_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "transfer_date" DATE NOT NULL,
    "status" "RemittanceStatus" NOT NULL DEFAULT 'PENDING',
    "confirmed_at" TIMESTAMPTZ(3),
    "cancelled_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "branch_id" UUID NOT NULL,
    "recorded_by_id" UUID NOT NULL,
    "confirmed_by_id" UUID,
    "evidence_id" UUID,

    CONSTRAINT "remittances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(18,2) NOT NULL,
    "state" "ReservationState" NOT NULL DEFAULT 'RESERVED',
    "settled_at" TIMESTAMPTZ(3),
    "remittance_id" UUID NOT NULL,

    CONSTRAINT "remittance_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remittance_cancellations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "decision_reason" TEXT,
    "decided_at" TIMESTAMPTZ(3),
    "remittance_id" UUID NOT NULL,
    "requested_by_id" UUID NOT NULL,
    "decided_by_id" UUID,

    CONSTRAINT "remittance_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "number" INTEGER NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gross_collections" DECIMAL(18,2) NOT NULL,
    "recognized_adjustments" DECIMAL(18,2) NOT NULL,
    "net_recognized" DECIMAL(18,2) NOT NULL,
    "confirmed_remittances" DECIMAL(18,2) NOT NULL,
    "pending_reservations" DECIMAL(18,2) NOT NULL,
    "signed_outstanding" DECIMAL(18,2) NOT NULL,
    "reconciliation_deficit" DECIMAL(18,2) NOT NULL,
    "available_to_remit" DECIMAL(18,2) NOT NULL,
    "report_id" UUID NOT NULL,
    "submitted_by_id" UUID NOT NULL,

    CONSTRAINT "report_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "RecognitionKind" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "source_occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "original_week_start" TIMESTAMPTZ(3) NOT NULL,
    "revision_id" UUID NOT NULL,
    "recognition_id" UUID NOT NULL,

    CONSTRAINT "report_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "approved_by_id" UUID NOT NULL,

    CONSTRAINT "report_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_transitions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" "ReportAction" NOT NULL,
    "from_status" "ReportStatus",
    "to_status" "ReportStatus" NOT NULL,
    "reason" TEXT,
    "report_version" INTEGER NOT NULL,
    "report_id" UUID NOT NULL,
    "actor_id" UUID,
    "audit_id" UUID NOT NULL,

    CONSTRAINT "report_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "ContentKind" NOT NULL,
    "page" "PublicPage",
    "slug" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cms_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_revisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "number" INTEGER NOT NULL,
    "status" "ContentRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "title_en" TEXT,
    "title_ur" TEXT,
    "summary_en" TEXT,
    "summary_ur" TEXT,
    "body_en" TEXT,
    "body_ur" TEXT,
    "starts_at" TIMESTAMPTZ(3),
    "ends_at" TIMESTAMPTZ(3),
    "location" TEXT,
    "sanitized_at" TIMESTAMPTZ(3),
    "published_at" TIMESTAMPTZ(3),
    "item_id" UUID NOT NULL,
    "image_id" UUID,
    "edited_by_id" UUID NOT NULL,
    "published_by_id" UUID,

    CONSTRAINT "cms_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_publications" (
    "item_id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_publications_pkey" PRIMARY KEY ("item_id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_kind" "AuditActorKind" NOT NULL,
    "system_actor" TEXT,
    "domain" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "actor_id" UUID,
    "branch_id" UUID,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_code_key" ON "cities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "staff_users_email_normalized_key" ON "staff_users"("email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "staff_credentials_staff_id_key" ON "staff_credentials"("staff_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_token_hash_key" ON "staff_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "staff_sessions_staff_id_revoked_at_idx" ON "staff_sessions"("staff_id", "revoked_at");

-- CreateIndex
CREATE INDEX "staff_sessions_absolute_expires_at_idx" ON "staff_sessions"("absolute_expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE INDEX "branches_city_id_status_idx" ON "branches"("city_id", "status");

-- CreateIndex
CREATE INDEX "branch_lead_assignments_branch_id_started_at_idx" ON "branch_lead_assignments"("branch_id", "started_at");

-- CreateIndex
CREATE INDEX "branch_lead_assignments_lead_id_ended_at_idx" ON "branch_lead_assignments"("lead_id", "ended_at");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_applications_reference_key" ON "volunteer_applications"("reference");

-- CreateIndex
CREATE INDEX "volunteer_applications_preferred_branch_id_status_created_a_idx" ON "volunteer_applications"("preferred_branch_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "volunteer_applications_email_normalized_idx" ON "volunteer_applications"("email_normalized");

-- CreateIndex
CREATE INDEX "volunteer_applications_phone_normalized_idx" ON "volunteer_applications"("phone_normalized");

-- CreateIndex
CREATE INDEX "application_decisions_application_id_created_at_idx" ON "application_decisions"("application_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "application_decisions_application_id_application_version_key" ON "application_decisions"("application_id", "application_version");

-- CreateIndex
CREATE UNIQUE INDEX "decision_notifications_decision_id_key" ON "decision_notifications"("decision_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_volunteer_id_key" ON "members"("volunteer_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_application_id_key" ON "members"("application_id");

-- CreateIndex
CREATE INDEX "members_branch_id_status_full_name_idx" ON "members"("branch_id", "status", "full_name");

-- CreateIndex
CREATE INDEX "members_email_normalized_idx" ON "members"("email_normalized");

-- CreateIndex
CREATE INDEX "members_phone_normalized_idx" ON "members"("phone_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "members_id_branch_id_key" ON "members"("id", "branch_id");

-- CreateIndex
CREATE INDEX "member_histories_member_id_created_at_idx" ON "member_histories"("member_id", "created_at");

-- CreateIndex
CREATE INDEX "teams_branch_id_idx" ON "teams"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_id_branch_id_key" ON "teams"("id", "branch_id");

-- CreateIndex
CREATE INDEX "member_assignments_member_id_ended_at_idx" ON "member_assignments"("member_id", "ended_at");

-- CreateIndex
CREATE INDEX "member_assignments_team_id_ended_at_idx" ON "member_assignments"("team_id", "ended_at");

-- CreateIndex
CREATE INDEX "member_transfers_source_branch_id_status_idx" ON "member_transfers"("source_branch_id", "status");

-- CreateIndex
CREATE INDEX "member_transfers_target_branch_id_status_idx" ON "member_transfers"("target_branch_id", "status");

-- CreateIndex
CREATE INDEX "member_transfers_member_id_created_at_idx" ON "member_transfers"("member_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "collections_reference_key" ON "collections"("reference");

-- CreateIndex
CREATE INDEX "collections_branch_id_occurred_at_idx" ON "collections"("branch_id", "occurred_at");

-- CreateIndex
CREATE INDEX "collections_branch_id_original_week_start_idx" ON "collections"("branch_id", "original_week_start");

-- CreateIndex
CREATE UNIQUE INDEX "collections_id_branch_id_key" ON "collections"("id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_adjustments_reference_key" ON "financial_adjustments"("reference");

-- CreateIndex
CREATE INDEX "financial_adjustments_branch_id_status_created_at_idx" ON "financial_adjustments"("branch_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "financial_adjustments_id_branch_id_key" ON "financial_adjustments"("id", "branch_id");

-- CreateIndex
CREATE INDEX "weekly_reports_status_week_start_idx" ON "weekly_reports"("status", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_branch_id_week_start_key" ON "weekly_reports"("branch_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reports_id_branch_id_key" ON "weekly_reports"("id", "branch_id");

-- CreateIndex
CREATE INDEX "financial_recognitions_branch_id_created_at_idx" ON "financial_recognitions"("branch_id", "created_at");

-- CreateIndex
CREATE INDEX "remittances_branch_id_status_transfer_date_idx" ON "remittances"("branch_id", "status", "transfer_date");

-- CreateIndex
CREATE UNIQUE INDEX "remittances_id_branch_id_key" ON "remittances"("id", "branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "remittance_reservations_remittance_id_key" ON "remittance_reservations"("remittance_id");

-- CreateIndex
CREATE INDEX "remittance_cancellations_remittance_id_status_idx" ON "remittance_cancellations"("remittance_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "report_revisions_report_id_number_key" ON "report_revisions"("report_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "report_revisions_id_report_id_key" ON "report_revisions"("id", "report_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_lines_revision_id_recognition_id_key" ON "report_lines"("revision_id", "recognition_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_approvals_report_id_key" ON "report_approvals"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_approvals_revision_id_key" ON "report_approvals"("revision_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_transitions_audit_id_key" ON "report_transitions"("audit_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_transitions_report_id_report_version_key" ON "report_transitions"("report_id", "report_version");

-- CreateIndex
CREATE UNIQUE INDEX "cms_items_page_key" ON "cms_items"("page");

-- CreateIndex
CREATE UNIQUE INDEX "cms_items_slug_key" ON "cms_items"("slug");

-- CreateIndex
CREATE INDEX "cms_items_kind_archived_at_display_order_idx" ON "cms_items"("kind", "archived_at", "display_order");

-- CreateIndex
CREATE INDEX "cms_revisions_ends_at_idx" ON "cms_revisions"("ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "cms_revisions_item_id_number_key" ON "cms_revisions"("item_id", "number");

-- CreateIndex
CREATE UNIQUE INDEX "cms_revisions_id_item_id_key" ON "cms_revisions"("id", "item_id");

-- CreateIndex
CREATE UNIQUE INDEX "cms_publications_revision_id_key" ON "cms_publications"("revision_id");

-- CreateIndex
CREATE INDEX "audit_events_branch_id_created_at_idx" ON "audit_events"("branch_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_domain_created_at_idx" ON "audit_events"("domain", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events"("entity_type", "entity_id", "created_at");

-- AddForeignKey
ALTER TABLE "city_counters" ADD CONSTRAINT "city_counters_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "staff_credentials" ADD CONSTRAINT "staff_credentials_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "credential_events" ADD CONSTRAINT "credential_events_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "credential_events" ADD CONSTRAINT "credential_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "branch_lead_assignments" ADD CONSTRAINT "branch_lead_assignments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "branch_lead_assignments" ADD CONSTRAINT "branch_lead_assignments_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "branch_lead_assignments" ADD CONSTRAINT "branch_lead_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_preferred_branch_id_fkey" FOREIGN KEY ("preferred_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "application_decisions" ADD CONSTRAINT "application_decisions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "volunteer_applications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "application_decisions" ADD CONSTRAINT "application_decisions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "decision_notifications" ADD CONSTRAINT "decision_notifications_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "application_decisions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "volunteer_applications"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_origin_city_id_fkey" FOREIGN KEY ("origin_city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_histories" ADD CONSTRAINT "member_histories_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_histories" ADD CONSTRAINT "member_histories_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_assignments" ADD CONSTRAINT "member_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_assignments" ADD CONSTRAINT "member_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_assignments" ADD CONSTRAINT "member_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_source_branch_id_fkey" FOREIGN KEY ("source_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_target_branch_id_fkey" FOREIGN KEY ("target_branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_recognitions" ADD CONSTRAINT "financial_recognitions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_recognitions" ADD CONSTRAINT "financial_recognitions_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_recognitions" ADD CONSTRAINT "financial_recognitions_adjustment_id_fkey" FOREIGN KEY ("adjustment_id") REFERENCES "financial_adjustments"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "financial_recognitions" ADD CONSTRAINT "financial_recognitions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_confirmed_by_id_fkey" FOREIGN KEY ("confirmed_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittance_reservations" ADD CONSTRAINT "remittance_reservations_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "remittances"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittance_cancellations" ADD CONSTRAINT "remittance_cancellations_remittance_id_fkey" FOREIGN KEY ("remittance_id") REFERENCES "remittances"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittance_cancellations" ADD CONSTRAINT "remittance_cancellations_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "remittance_cancellations" ADD CONSTRAINT "remittance_cancellations_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_revisions" ADD CONSTRAINT "report_revisions_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_lines" ADD CONSTRAINT "report_lines_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "report_revisions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_lines" ADD CONSTRAINT "report_lines_recognition_id_fkey" FOREIGN KEY ("recognition_id") REFERENCES "financial_recognitions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "report_revisions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_approvals" ADD CONSTRAINT "report_approvals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_transitions" ADD CONSTRAINT "report_transitions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "weekly_reports"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_transitions" ADD CONSTRAINT "report_transitions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "report_transitions" ADD CONSTRAINT "report_transitions_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audit_events"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "cms_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_revisions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_publications" ADD CONSTRAINT "cms_publications_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "cms_items"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "cms_publications" ADD CONSTRAINT "cms_publications_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "cms_revisions"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "staff_users"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- PostgreSQL invariants not expressible in the Prisma datamodel.
ALTER TABLE "city_counters" ADD CONSTRAINT "counter_nonnegative" CHECK (value >= 0);
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_normalized_email" CHECK (email_normalized = lower(btrim(email_normalized)) AND length(email_normalized) BETWEEN 3 AND 254);
ALTER TABLE "staff_credentials" ADD CONSTRAINT "credential_expiry" CHECK (password_hash LIKE '$argon2id$%' AND ((must_change_password AND temporary_issued_at IS NOT NULL AND temporary_expires_at = temporary_issued_at + interval '24 hours') OR (NOT must_change_password AND temporary_issued_at IS NULL AND temporary_expires_at IS NULL)));
ALTER TABLE "staff_sessions" ADD CONSTRAINT "session_lifetimes" CHECK (absolute_expires_at = issued_at + interval '24 hours' AND idle_expires_at > issued_at AND idle_expires_at <= absolute_expires_at AND idle_expires_at <= last_activity_at + interval '8 hours');
ALTER TABLE "branch_lead_assignments" ADD CONSTRAINT "branch_lead_assignments_interval" CHECK (ended_at IS NULL OR ended_at >= started_at);
ALTER TABLE "member_assignments" ADD CONSTRAINT "member_assignments_interval" CHECK (ended_at IS NULL OR ended_at >= started_at);
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "application_fields" CHECK (length(btrim(full_name)) BETWEEN 2 AND 100 AND length(email_normalized) BETWEEN 3 AND 254 AND email_normalized = lower(btrim(email_normalized)) AND phone_normalized ~ '^\+923[0-9]{9}$' AND length(btrim(motivation)) BETWEEN 20 AND 1000 AND length(btrim(consent_version)) > 0 AND length(btrim(residential_city)) > 0 AND length(btrim(area_of_interest)) > 0);
ALTER TABLE "members" ADD CONSTRAINT "member_contacts" CHECK (email_normalized = lower(btrim(email_normalized)) AND phone_normalized ~ '^\+923[0-9]{9}$');
ALTER TABLE "application_decisions" ADD CONSTRAINT "decision_reason" CHECK (kind NOT IN ('DECLINE','REVERSE_ACCEPTANCE','REVERSE_DECLINE') OR length(btrim(reason)) > 0 AND reason IS NOT NULL);
ALTER TABLE "application_decisions" ADD CONSTRAINT "decision_transition" CHECK ((kind IN ('ACCEPT','REACCEPT') AND from_status='PENDING' AND to_status='ACCEPTED') OR (kind='DECLINE' AND from_status='PENDING' AND to_status='DECLINED') OR (kind='REVERSE_ACCEPTANCE' AND from_status='ACCEPTED' AND to_status='PENDING') OR (kind='REVERSE_DECLINE' AND from_status='DECLINED' AND to_status='PENDING'));
ALTER TABLE "decision_notifications" ADD CONSTRAINT "notification_attempts" CHECK (attempts >= 0 AND (status <> 'SENT' OR sent_at IS NOT NULL));
ALTER TABLE "member_transfers" ADD CONSTRAINT "transfer_different_branches" CHECK (source_branch_id <> target_branch_id);
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_decision" CHECK ((status='PENDING' AND decided_at IS NULL AND decided_by_id IS NULL) OR (status IN ('APPROVED','REJECTED') AND decided_at IS NOT NULL AND decided_by_id IS NOT NULL));
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_decision" CHECK ((status='PENDING_REVIEW' AND decided_at IS NULL AND decided_by_id IS NULL) OR (status IN ('APPROVED','REJECTED') AND decided_at IS NOT NULL AND decided_by_id IS NOT NULL));
ALTER TABLE "remittance_cancellations" ADD CONSTRAINT "remittance_cancellations_decision" CHECK ((status='PENDING' AND decided_at IS NULL AND decided_by_id IS NULL) OR (status IN ('APPROVED','REJECTED') AND decided_at IS NOT NULL AND decided_by_id IS NOT NULL));
ALTER TABLE "media_assets" ADD CONSTRAINT "media_metadata" CHECK (size_bytes >= 0 AND length(btrim(storage_key)) > 0 AND storage_key NOT LIKE '/%' AND storage_key NOT LIKE '%..%' AND storage_key NOT LIKE '%:%' AND length(btrim(content_hash)) > 0);
ALTER TABLE "collections" ADD CONSTRAINT "collections_positive_amount" CHECK (amount > 0);
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_positive_amount" CHECK (amount > 0);
ALTER TABLE "remittance_reservations" ADD CONSTRAINT "remittance_reservations_positive_amount" CHECK (amount > 0);
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "adjustment_reason" CHECK (length(btrim(reason)) > 0);
ALTER TABLE "weekly_reports" ADD CONSTRAINT "report_week" CHECK (week_start = date_trunc('week', week_start AT TIME ZONE 'Asia/Karachi') AT TIME ZONE 'Asia/Karachi' AND week_end = ((week_start AT TIME ZONE 'Asia/Karachi') + interval '7 days') AT TIME ZONE 'Asia/Karachi');
ALTER TABLE "weekly_reports" ADD CONSTRAINT "approval_lock" CHECK ((status='APPROVED' AND approved_at IS NOT NULL AND locked_at IS NOT NULL AND locked_at=approved_at) OR (status <> 'APPROVED' AND approved_at IS NULL AND locked_at IS NULL));
ALTER TABLE "financial_recognitions" ADD CONSTRAINT "recognition_source" CHECK ((kind IN ('ORIGINAL','LATE_ENTRY') AND collection_id IS NOT NULL AND adjustment_id IS NULL) OR (kind='ADJUSTMENT' AND adjustment_id IS NOT NULL AND collection_id IS NULL));
ALTER TABLE "remittances" ADD CONSTRAINT "remittance_fields" CHECK (length(btrim(reference)) > 0 AND ((status='PENDING' AND confirmed_at IS NULL AND confirmed_by_id IS NULL AND cancelled_at IS NULL) OR (status='CONFIRMED' AND confirmed_at IS NOT NULL AND confirmed_by_id IS NOT NULL AND cancelled_at IS NULL) OR (status='CANCELLED' AND cancelled_at IS NOT NULL AND confirmed_at IS NULL AND confirmed_by_id IS NULL)));
ALTER TABLE "remittance_reservations" ADD CONSTRAINT "reservation_settlement" CHECK ((state='RESERVED' AND settled_at IS NULL) OR (state IN ('CONFIRMED','RELEASED') AND settled_at IS NOT NULL));
ALTER TABLE "report_revisions" ADD CONSTRAINT "revision_totals" CHECK (number > 0 AND gross_collections >= 0 AND confirmed_remittances >= 0 AND pending_reservations >= 0 AND reconciliation_deficit >= 0 AND available_to_remit >= 0);
ALTER TABLE "report_transitions" ADD CONSTRAINT "return_reason" CHECK (action <> 'RETURN' OR reason IS NOT NULL AND length(btrim(reason)) > 0);
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_actor" CHECK ((actor_kind='STAFF' AND actor_id IS NOT NULL AND system_actor IS NULL) OR (actor_kind='SYSTEM' AND actor_id IS NULL AND system_actor IS NOT NULL AND length(btrim(system_actor)) > 0));
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_required" CHECK (length(btrim(domain)) > 0 AND length(btrim(action)) > 0 AND length(btrim(entity_type)) > 0 AND length(btrim(entity_id)) > 0);
ALTER TABLE "cms_items" ADD CONSTRAINT "fixed_page_identity" CHECK ((kind <> 'PAGE' AND page IS NULL) OR (kind='PAGE' AND page IS NOT NULL AND slug = CASE page WHEN 'HOME' THEN 'home' WHEN 'ABOUT' THEN 'about' WHEN 'PROGRAMS' THEN 'programs' WHEN 'BRANCHES' THEN 'branches' WHEN 'EVENTS' THEN 'events' WHEN 'GET_INVOLVED' THEN 'get-involved' WHEN 'CONTACT' THEN 'contact' END));
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_event_interval" CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at);
ALTER TABLE "cms_revisions" ADD CONSTRAINT "cms_published_metadata" CHECK (status <> 'PUBLISHED' OR (published_at IS NOT NULL AND published_by_id IS NOT NULL AND sanitized_at IS NOT NULL));
ALTER TABLE "staff_users" ADD CONSTRAINT "staff_users_version" CHECK (version >= 0);
ALTER TABLE "branches" ADD CONSTRAINT "branches_version" CHECK (version >= 0);
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_version" CHECK (version >= 0);
ALTER TABLE "members" ADD CONSTRAINT "members_version" CHECK (version >= 0);
ALTER TABLE "member_transfers" ADD CONSTRAINT "member_transfers_version" CHECK (version >= 0);
ALTER TABLE "collections" ADD CONSTRAINT "collections_version" CHECK (version >= 0);
ALTER TABLE "financial_adjustments" ADD CONSTRAINT "financial_adjustments_version" CHECK (version >= 0);
ALTER TABLE "weekly_reports" ADD CONSTRAINT "weekly_reports_version" CHECK (version >= 0);
ALTER TABLE "remittances" ADD CONSTRAINT "remittances_version" CHECK (version >= 0);
ALTER TABLE "cms_items" ADD CONSTRAINT "cms_items_version" CHECK (version >= 0);

CREATE UNIQUE INDEX one_current_lead_per_branch ON branch_lead_assignments(branch_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX one_current_branch_per_lead ON branch_lead_assignments(lead_id) WHERE ended_at IS NULL;
CREATE UNIQUE INDEX pending_email_unique ON volunteer_applications(email_normalized) WHERE status='PENDING';
CREATE UNIQUE INDEX pending_phone_unique ON volunteer_applications(phone_normalized) WHERE status='PENDING';
CREATE UNIQUE INDEX active_member_email_unique ON members(email_normalized) WHERE status='ACTIVE';
CREATE UNIQUE INDEX active_member_phone_unique ON members(phone_normalized) WHERE status='ACTIVE';
CREATE UNIQUE INDEX one_pending_adjustment ON financial_adjustments(collection_id) WHERE status='PENDING_REVIEW';
CREATE UNIQUE INDEX collection_recognized_once ON financial_recognitions(collection_id) WHERE collection_id IS NOT NULL;
CREATE UNIQUE INDEX adjustment_recognized_once ON financial_recognitions(adjustment_id) WHERE adjustment_id IS NOT NULL;
CREATE UNIQUE INDEX one_pending_cancellation ON remittance_cancellations(remittance_id) WHERE status='PENDING';

CREATE FUNCTION hwf_reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'immutable history cannot be changed' USING ERRCODE='23514'; END $$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER credential_history_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON credential_events FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER application_history_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON application_decisions FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER member_history_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON member_histories FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER report_revision_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON report_revisions FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER report_line_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON report_lines FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER report_approval_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON report_approvals FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER report_transition_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON report_transitions FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER recognition_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON financial_recognitions FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER branch_no_delete BEFORE DELETE ON branches FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER member_no_delete BEFORE DELETE ON members FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER cms_item_no_delete BEFORE DELETE ON cms_items FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();

CREATE FUNCTION hwf_identity_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.id <> OLD.id THEN RAISE EXCEPTION 'immutable internal identity' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='branches' THEN IF NEW.code <> OLD.code THEN RAISE EXCEPTION 'immutable branch code' USING ERRCODE='23514'; END IF; END IF;
 IF TG_TABLE_NAME='members' THEN
  IF NEW.volunteer_id <> OLD.volunteer_id OR NEW.application_id <> OLD.application_id OR NEW.origin_city_id <> OLD.origin_city_id THEN RAISE EXCEPTION 'immutable member identity/link' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER branch_identity BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION hwf_identity_guard();
CREATE TRIGGER member_identity BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION hwf_identity_guard();

CREATE FUNCTION hwf_lead_check() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='branch_lead_assignments' AND TG_OP='UPDATE' THEN
  IF OLD.ended_at IS NULL AND NEW.ended_at IS NOT NULL AND NOT EXISTS(SELECT 1 FROM branch_lead_assignments WHERE branch_id=OLD.branch_id AND ended_at IS NULL AND id<>OLD.id) THEN RAISE EXCEPTION 'assigned lead removal requires replacement' USING ERRCODE='23514'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM branch_lead_assignments a JOIN staff_users s ON s.id=a.lead_id WHERE a.ended_at IS NULL AND (s.status<>'ACTIVE' OR s.role<>'BRANCH_LEAD')) THEN RAISE EXCEPTION 'current lead must be active Branch Lead' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM branches b WHERE b.status='ACTIVE' AND NOT EXISTS(SELECT 1 FROM branch_lead_assignments a WHERE a.branch_id=b.id AND a.ended_at IS NULL)) THEN RAISE EXCEPTION 'Active branch requires a current lead' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER branch_lead_valid AFTER INSERT OR UPDATE ON branch_lead_assignments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_lead_check();
CREATE CONSTRAINT TRIGGER active_branch_lead AFTER INSERT OR UPDATE ON branches DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_lead_check();
CREATE CONSTRAINT TRIGGER active_lead_account AFTER UPDATE ON staff_users DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_lead_check();

CREATE FUNCTION hwf_branch_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN IF NEW.status<>'FORMING' THEN RAISE EXCEPTION 'new branches start Forming' USING ERRCODE='23514'; END IF; RETURN NEW; END IF;
 IF NEW.status<>OLD.status AND NOT ((OLD.status='FORMING' AND NEW.status IN ('ACTIVE','CLOSED')) OR (OLD.status='ACTIVE' AND NEW.status IN ('PAUSED','CLOSED')) OR (OLD.status='PAUSED' AND NEW.status IN ('ACTIVE','CLOSED'))) THEN RAISE EXCEPTION 'invalid branch transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER branch_lifecycle BEFORE INSERT OR UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION hwf_branch_lifecycle();

-- Serialize staff mutations for last-admin safety and lead/activation races.
CREATE FUNCTION hwf_staff_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(72942001);
 IF TG_OP IN ('UPDATE','DELETE') AND OLD.role='SUPER_ADMIN' AND OLD.status='ACTIVE' THEN
  IF TG_OP='DELETE' OR NEW.role<>'SUPER_ADMIN' OR NEW.status<>'ACTIVE' THEN
   IF NOT EXISTS(SELECT 1 FROM staff_users WHERE id<>OLD.id AND role='SUPER_ADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'last active Super Admin' USING ERRCODE='23514'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER staff_guard BEFORE INSERT OR UPDATE OR DELETE ON staff_users FOR EACH ROW EXECUTE FUNCTION hwf_staff_guard();
CREATE FUNCTION hwf_lead_serialize() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM pg_advisory_xact_lock(72942001); RETURN NEW; END $$;
CREATE TRIGGER lead_serialize BEFORE INSERT OR UPDATE ON branch_lead_assignments FOR EACH ROW EXECUTE FUNCTION hwf_lead_serialize();
CREATE TRIGGER lead_history_no_delete BEFORE DELETE OR TRUNCATE ON branch_lead_assignments FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_lead_history() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.lead_id<>OLD.lead_id OR NEW.branch_id<>OLD.branch_id OR NEW.started_at<>OLD.started_at OR OLD.ended_at IS NOT NULL THEN RAISE EXCEPTION 'lead assignment history immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER lead_history_guard BEFORE UPDATE ON branch_lead_assignments FOR EACH ROW EXECUTE FUNCTION hwf_lead_history();
CREATE TRIGGER branch_serialize BEFORE INSERT OR UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION hwf_lead_serialize();

-- Cross-table contact conflicts are serialized; historical Declined/Inactive contacts are not globally reserved.
CREATE FUNCTION hwf_contact_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE k text; own_application uuid;
BEGIN
 FOR k IN SELECT unnest(ARRAY['email:'||NEW.email_normalized,'phone:'||NEW.phone_normalized]) ORDER BY 1 LOOP PERFORM pg_advisory_xact_lock(hashtextextended(k,0)); END LOOP;
 IF TG_TABLE_NAME='volunteer_applications' THEN
  IF NEW.status<>'PENDING' THEN RETURN NEW; END IF;
  own_application=NEW.id;
 ELSE
  IF NEW.status<>'ACTIVE' THEN RETURN NEW; END IF;
  own_application=NEW.application_id;
 END IF;
 IF EXISTS(SELECT 1 FROM volunteer_applications WHERE status='PENDING' AND id<>own_application AND (email_normalized=NEW.email_normalized OR phone_normalized=NEW.phone_normalized)) OR EXISTS(SELECT 1 FROM members WHERE status='ACTIVE' AND application_id<>own_application AND (email_normalized=NEW.email_normalized OR phone_normalized=NEW.phone_normalized)) THEN RAISE EXCEPTION 'eligible contact conflict' USING ERRCODE='23505'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER application_contacts BEFORE INSERT OR UPDATE ON volunteer_applications FOR EACH ROW EXECUTE FUNCTION hwf_contact_guard();
CREATE TRIGGER member_contacts BEFORE INSERT OR UPDATE ON members FOR EACH ROW EXECUTE FUNCTION hwf_contact_guard();
CREATE FUNCTION hwf_application_branch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' AND NEW.status<>'PENDING' THEN RAISE EXCEPTION 'intake starts Pending' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND NEW.reference<>OLD.reference THEN RAISE EXCEPTION 'immutable application reference' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND NEW.status<>OLD.status AND NOT ((OLD.status='PENDING' AND NEW.status IN ('ACCEPTED','DECLINED')) OR (OLD.status IN ('ACCEPTED','DECLINED') AND NEW.status='PENDING')) THEN RAISE EXCEPTION 'invalid application transition' USING ERRCODE='23514'; END IF;
 IF NEW.status='DECLINED' AND EXISTS(SELECT 1 FROM members WHERE application_id=NEW.id) THEN RAISE EXCEPTION 'retained-member Decline policy not approved' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' OR NEW.status='ACCEPTED' AND OLD.status<>'ACCEPTED' OR NEW.preferred_branch_id<>OLD.preferred_branch_id THEN
  PERFORM 1 FROM branches WHERE id=NEW.preferred_branch_id AND status='ACTIVE' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active operational branch required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER application_active_branch BEFORE INSERT OR UPDATE ON volunteer_applications FOR EACH ROW EXECUTE FUNCTION hwf_application_branch();
CREATE FUNCTION hwf_accepted_link() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM volunteer_applications a WHERE a.id=NEW.id AND a.status='ACCEPTED' AND NOT EXISTS(SELECT 1 FROM members m WHERE m.application_id=a.id)) THEN RAISE EXCEPTION 'Accepted application requires permanent member linkage' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER accepted_member_link AFTER INSERT OR UPDATE ON volunteer_applications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_accepted_link();
CREATE FUNCTION hwf_new_member() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE prefix text; actual_city uuid;
BEGIN
 IF NEW.status<>'ACTIVE' THEN RAISE EXCEPTION 'initial accepted member starts Active' USING ERRCODE='23514'; END IF;
 SELECT city_id INTO actual_city FROM branches WHERE id=NEW.branch_id AND status='ACTIVE' FOR UPDATE;
 SELECT code INTO prefix FROM cities WHERE id=NEW.origin_city_id;
 IF actual_city IS NULL OR actual_city<>NEW.origin_city_id OR split_part(NEW.volunteer_id,'-V',1)<>prefix THEN RAISE EXCEPTION 'member initial city/Active branch mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER new_member_city BEFORE INSERT ON members FOR EACH ROW EXECUTE FUNCTION hwf_new_member();
CREATE FUNCTION hwf_assignment_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE member_branch uuid; team_branch uuid;
BEGIN
 IF TG_OP='INSERT' OR OLD.ended_at IS NOT NULL AND NEW.ended_at IS NULL THEN
  SELECT branch_id INTO member_branch FROM members WHERE id=NEW.member_id AND status='ACTIVE' FOR UPDATE;
  SELECT branch_id INTO team_branch FROM teams WHERE id=NEW.team_id AND archived_at IS NULL;
  IF member_branch IS NULL OR member_branch IS DISTINCT FROM team_branch THEN RAISE EXCEPTION 'Active member/current team scope required' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND (NEW.member_id<>OLD.member_id OR NEW.team_id<>OLD.team_id OR NEW.started_at<>OLD.started_at OR OLD.ended_at IS NOT NULL) THEN RAISE EXCEPTION 'preserve assignment history; create a new assignment' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER member_assignment_guard BEFORE INSERT OR UPDATE ON member_assignments FOR EACH ROW EXECUTE FUNCTION hwf_assignment_guard();
CREATE FUNCTION hwf_inactive_assignments() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM members m JOIN member_assignments a ON a.member_id=m.id WHERE m.id=NEW.id AND m.status='INACTIVE' AND a.ended_at IS NULL) THEN RAISE EXCEPTION 'inactivation must end active assignments atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER inactive_assignment_end AFTER UPDATE ON members DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_inactive_assignments();

CREATE FUNCTION hwf_collection_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM 1 FROM branches WHERE id=NEW.branch_id AND status<>'CLOSED' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no ordinary Closed-branch collections' USING ERRCODE='23514'; END IF;
  NEW.created_at=statement_timestamp();
  IF NEW.member_id IS NOT NULL THEN
   PERFORM 1 FROM members WHERE id=NEW.member_id AND branch_id=NEW.branch_id AND status='ACTIVE' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Active own-branch member required' USING ERRCODE='23514'; END IF;
  END IF;
 ELSE
  IF NEW.created_at<>OLD.created_at OR NEW.id<>OLD.id OR NEW.branch_id<>OLD.branch_id OR NEW.reference<>OLD.reference THEN RAISE EXCEPTION 'immutable collection metadata' USING ERRCODE='23514'; END IF;
  IF clock_timestamp() >= OLD.created_at+interval '168 hours' OR EXISTS(SELECT 1 FROM financial_recognitions r JOIN weekly_reports w ON w.id=r.report_id WHERE r.collection_id=OLD.id AND w.status IN ('SUBMITTED','APPROVED')) OR EXISTS(SELECT 1 FROM report_lines l JOIN financial_recognitions r ON r.id=l.recognition_id JOIN report_approvals a ON a.revision_id=l.revision_id WHERE r.collection_id=OLD.id) THEN RAISE EXCEPTION 'collection age/report lock' USING ERRCODE='23514'; END IF;
 END IF;
 NEW.original_week_start=date_trunc('week',NEW.occurred_at AT TIME ZONE 'Asia/Karachi') AT TIME ZONE 'Asia/Karachi';
 RETURN NEW;
END $$;
CREATE TRIGGER collection_guard BEFORE INSERT OR UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION hwf_collection_guard();
CREATE TRIGGER collection_preserve_history BEFORE DELETE ON collections FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_adjustment_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE original numeric; total numeric; source_branch uuid;
BEGIN
 IF TG_OP='INSERT' AND NEW.status<>'PENDING_REVIEW' THEN RAISE EXCEPTION 'adjustment request starts PendingReview' USING ERRCODE='23514'; END IF;
 SELECT amount,branch_id INTO original,source_branch FROM collections WHERE id=NEW.collection_id FOR UPDATE;
 IF source_branch IS DISTINCT FROM NEW.branch_id THEN RAISE EXCEPTION 'adjustment source branch mismatch' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND OLD.status<>'PENDING_REVIEW' THEN RAISE EXCEPTION 'decided adjustment immutable' USING ERRCODE='23514'; END IF;
 IF NEW.status='APPROVED' THEN
  SELECT COALESCE(sum(amount),0) INTO total FROM financial_adjustments WHERE collection_id=NEW.collection_id AND status='APPROVED' AND id<>NEW.id;
  IF original+total+NEW.amount<0 THEN RAISE EXCEPTION 'cumulative corrected amount negative' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER adjustment_guard BEFORE INSERT OR UPDATE ON financial_adjustments FOR EACH ROW EXECUTE FUNCTION hwf_adjustment_guard();
CREATE TRIGGER adjustment_preserve_history BEFORE DELETE ON financial_adjustments FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_recognition_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w weekly_reports; source_branch uuid; original_week timestamptz; adjustment_state "AdjustmentStatus";
BEGIN
 SELECT * INTO w FROM weekly_reports WHERE id=NEW.report_id FOR UPDATE;
 IF w.branch_id IS DISTINCT FROM NEW.branch_id OR w.status NOT IN ('DRAFT','RETURNED') THEN RAISE EXCEPTION 'recognition requires eligible same-branch report' USING ERRCODE='23514'; END IF;
 IF NEW.collection_id IS NOT NULL THEN SELECT branch_id,original_week_start INTO source_branch,original_week FROM collections WHERE id=NEW.collection_id FOR UPDATE;
 ELSE SELECT a.branch_id,c.original_week_start,a.status INTO source_branch,original_week,adjustment_state FROM financial_adjustments a JOIN collections c ON c.id=a.collection_id WHERE a.id=NEW.adjustment_id FOR UPDATE OF a;
  IF adjustment_state IS DISTINCT FROM 'APPROVED' THEN RAISE EXCEPTION 'only Approved adjustment recognized' USING ERRCODE='23514'; END IF;
 END IF;
 IF source_branch IS DISTINCT FROM NEW.branch_id OR (NEW.kind='ORIGINAL' AND w.week_start<>original_week) OR (NEW.kind IN ('LATE_ENTRY','ADJUSTMENT') AND w.week_start<=original_week) THEN RAISE EXCEPTION 'recognition attribution mismatch' USING ERRCODE='23514'; END IF;
 IF NEW.kind='LATE_ENTRY' AND NOT EXISTS(SELECT 1 FROM weekly_reports WHERE branch_id=NEW.branch_id AND week_start=original_week AND status='APPROVED') THEN RAISE EXCEPTION 'Late Entry requires locked original week' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER recognition_guard BEFORE INSERT ON financial_recognitions FOR EACH ROW EXECUTE FUNCTION hwf_recognition_guard();

CREATE FUNCTION hwf_reservation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent remittances;
BEGIN
 SELECT * INTO parent FROM remittances WHERE id=NEW.remittance_id FOR UPDATE;
 IF NEW.amount<>parent.amount THEN RAISE EXCEPTION 'reservation amount mismatch' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (OLD.state<>'RESERVED' OR NEW.remittance_id<>OLD.remittance_id OR NEW.amount<>OLD.amount OR NEW.id<>OLD.id) THEN RAISE EXCEPTION 'reservation settled once only' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reservation_guard BEFORE INSERT OR UPDATE ON remittance_reservations FOR EACH ROW EXECUTE FUNCTION hwf_reservation_guard();
CREATE TRIGGER reservation_preserve_history BEFORE DELETE ON remittance_reservations FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_remittance_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE rid uuid;
BEGIN
 IF TG_TABLE_NAME='remittances' THEN rid=NEW.id; ELSE rid=NEW.remittance_id; END IF;
 IF EXISTS(SELECT 1 FROM remittances r WHERE r.id=rid AND NOT EXISTS(SELECT 1 FROM remittance_reservations v WHERE v.remittance_id=r.id AND v.amount=r.amount AND ((r.status='PENDING' AND v.state='RESERVED') OR (r.status='CONFIRMED' AND v.state='CONFIRMED') OR (r.status='CANCELLED' AND v.state='RELEASED')))) THEN RAISE EXCEPTION 'remittance/reservation must settle atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER remittance_reservation_consistent AFTER INSERT OR UPDATE ON remittances DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_remittance_consistency();
CREATE CONSTRAINT TRIGGER reservation_remittance_consistent AFTER INSERT OR UPDATE ON remittance_reservations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_remittance_consistency();
CREATE FUNCTION hwf_remittance_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status<>'PENDING' THEN RAISE EXCEPTION 'settled remittance immutable' USING ERRCODE='23514'; END IF;
 IF NEW.branch_id<>OLD.branch_id OR NEW.amount<>OLD.amount OR NEW.reference<>OLD.reference OR NEW.transfer_date<>OLD.transfer_date THEN RAISE EXCEPTION 'original remittance details immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER remittance_immutable BEFORE UPDATE ON remittances FOR EACH ROW EXECUTE FUNCTION hwf_remittance_immutable();
CREATE TRIGGER remittance_preserve_history BEFORE DELETE ON remittances FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();

CREATE FUNCTION hwf_report_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  IF NEW.status<>'DRAFT' THEN RAISE EXCEPTION 'new reports start Draft' USING ERRCODE='23514'; END IF;
  PERFORM 1 FROM branches WHERE id=NEW.branch_id AND status IN ('ACTIVE','PAUSED') FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ordinary report requires Active/Paused branch' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD.status='APPROVED' OR NEW.branch_id<>OLD.branch_id OR NEW.week_start<>OLD.week_start OR NEW.week_end<>OLD.week_end THEN RAISE EXCEPTION 'immutable approved/report identity' USING ERRCODE='23514'; END IF;
  IF NEW.status<>OLD.status AND NOT ((OLD.status IN ('DRAFT','RETURNED') AND NEW.status='SUBMITTED') OR (OLD.status='SUBMITTED' AND NEW.status IN ('RETURNED','APPROVED'))) THEN RAISE EXCEPTION 'invalid report transition' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER report_guard BEFORE INSERT OR UPDATE ON weekly_reports FOR EACH ROW EXECUTE FUNCTION hwf_report_guard();
CREATE TRIGGER report_preserve_history BEFORE DELETE ON weekly_reports FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_approval_link() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM weekly_reports w WHERE w.id=NEW.id AND w.status='APPROVED' AND NOT EXISTS(SELECT 1 FROM report_approvals a JOIN report_revisions r ON r.id=a.revision_id WHERE a.report_id=w.id AND r.report_id=w.id)) THEN RAISE EXCEPTION 'Approved report requires its frozen revision' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER approved_revision_required AFTER UPDATE ON weekly_reports DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_approval_link();
CREATE FUNCTION hwf_approval_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM report_revisions WHERE id=NEW.revision_id AND report_id=NEW.report_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'approval revision/report mismatch' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER approval_revision_guard BEFORE INSERT ON report_approvals FOR EACH ROW EXECUTE FUNCTION hwf_approval_guard();
CREATE FUNCTION hwf_line_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE revision_report uuid; recognition_report uuid; revision_xid xid; source_kind "RecognitionKind"; source_amount numeric; source_occurred timestamptz; source_week timestamptz;
BEGIN
 SELECT report_id,xmin INTO revision_report,revision_xid FROM report_revisions WHERE id=NEW.revision_id;
 SELECT r.report_id,r.kind,COALESCE(c.amount,a.amount),COALESCE(c.occurred_at,original.occurred_at),COALESCE(c.original_week_start,original.original_week_start)
 INTO recognition_report,source_kind,source_amount,source_occurred,source_week
 FROM financial_recognitions r LEFT JOIN collections c ON c.id=r.collection_id LEFT JOIN financial_adjustments a ON a.id=r.adjustment_id LEFT JOIN collections original ON original.id=a.collection_id WHERE r.id=NEW.recognition_id;
 IF NEW.kind IS DISTINCT FROM source_kind OR NEW.amount IS DISTINCT FROM source_amount OR NEW.source_occurred_at IS DISTINCT FROM source_occurred OR NEW.original_week_start IS DISTINCT FROM source_week THEN RAISE EXCEPTION 'snapshot source evidence mismatch' USING ERRCODE='23514'; END IF;
 IF revision_report IS DISTINCT FROM recognition_report OR revision_xid<>pg_current_xact_id()::text::xid THEN RAISE EXCEPTION 'frozen lines must be captured with same-report revision transaction' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER snapshot_line_guard BEFORE INSERT ON report_lines FOR EACH ROW EXECUTE FUNCTION hwf_line_guard();

CREATE FUNCTION hwf_cms_revision_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE kind "ContentKind";
BEGIN
 IF TG_OP='DELETE' THEN IF OLD.status='PUBLISHED' THEN RAISE EXCEPTION 'published revision history immutable' USING ERRCODE='23514'; END IF; RETURN OLD; END IF;
 IF TG_OP='UPDATE' AND (OLD.status='PUBLISHED' OR NEW.item_id<>OLD.item_id OR NEW.number<>OLD.number) THEN RAISE EXCEPTION 'published revision/identity immutable' USING ERRCODE='23514'; END IF;
 SELECT c.kind INTO kind FROM cms_items c WHERE c.id=NEW.item_id;
 IF NEW.status='PUBLISHED' THEN
  IF COALESCE(length(btrim(NEW.title_en)),0)=0 OR COALESCE(length(btrim(NEW.title_ur)),0)=0 OR COALESCE(length(btrim(NEW.body_en)),0)=0 OR COALESCE(length(btrim(NEW.body_ur)),0)=0 THEN RAISE EXCEPTION 'bilingual title/body required' USING ERRCODE='23514'; END IF;
  IF kind='PROGRAM' AND (COALESCE(length(btrim(NEW.summary_en)),0)=0 OR COALESCE(length(btrim(NEW.summary_ur)),0)=0) THEN RAISE EXCEPTION 'bilingual Program summary required' USING ERRCODE='23514'; END IF;
  IF kind='EVENT' AND (NEW.starts_at IS NULL OR NEW.ends_at IS NULL OR NEW.ends_at<=NEW.starts_at OR COALESCE(length(btrim(NEW.location)),0)=0) THEN RAISE EXCEPTION 'Event location/start/end required' USING ERRCODE='23514'; END IF;
  IF NEW.image_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM media_assets WHERE id=NEW.image_id AND validated_at IS NOT NULL) THEN RAISE EXCEPTION 'validated image reference required' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cms_revision_guard BEFORE INSERT OR UPDATE OR DELETE ON cms_revisions FOR EACH ROW EXECUTE FUNCTION hwf_cms_revision_guard();
CREATE FUNCTION hwf_publication_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 PERFORM 1 FROM cms_revisions r JOIN cms_items c ON c.id=r.item_id WHERE r.id=NEW.revision_id AND r.item_id=NEW.item_id AND r.status='PUBLISHED' AND c.archived_at IS NULL FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'publication must reference this active item published revision' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER publication_guard BEFORE INSERT OR UPDATE ON cms_publications FOR EACH ROW EXECUTE FUNCTION hwf_publication_guard();
CREATE FUNCTION hwf_cms_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.kind<>OLD.kind OR NEW.page IS DISTINCT FROM OLD.page OR OLD.page IS NOT NULL AND NEW.slug<>OLD.slug THEN RAISE EXCEPTION 'fixed CMS/page identity' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cms_identity BEFORE UPDATE ON cms_items FOR EACH ROW EXECUTE FUNCTION hwf_cms_identity();
CREATE FUNCTION hwf_retired_visibility() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM cms_items c JOIN cms_publications p ON p.item_id=c.id WHERE c.id=NEW.id AND c.archived_at IS NOT NULL) THEN RAISE EXCEPTION 'retirement must clear publication atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER retired_publication AFTER UPDATE ON cms_items DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_retired_visibility();

CREATE FUNCTION hwf_cancellation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='INSERT' THEN
  PERFORM 1 FROM remittances WHERE id=NEW.remittance_id AND status='PENDING' FOR UPDATE;
  IF NOT FOUND OR NEW.status<>'PENDING' THEN RAISE EXCEPTION 'cancellation starts as Pending against Pending remittance' USING ERRCODE='23514'; END IF;
 ELSE
  IF OLD.status<>'PENDING' OR NEW.remittance_id<>OLD.remittance_id OR NEW.requested_by_id<>OLD.requested_by_id THEN RAISE EXCEPTION 'cancellation decision/history immutable' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER cancellation_guard BEFORE INSERT OR UPDATE ON remittance_cancellations FOR EACH ROW EXECUTE FUNCTION hwf_cancellation_guard();
CREATE TRIGGER cancellation_preserve_history BEFORE DELETE ON remittance_cancellations FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_cancellation_consistency() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM remittance_cancellations c JOIN remittances r ON r.id=c.remittance_id WHERE c.id=NEW.id AND c.status='APPROVED' AND r.status<>'CANCELLED') THEN RAISE EXCEPTION 'approved cancellation and settlement must commit together' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER cancellation_settlement AFTER INSERT OR UPDATE ON remittance_cancellations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_cancellation_consistency();

CREATE TRIGGER application_preserve_history BEFORE DELETE ON volunteer_applications FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER team_assignment_preserve_history BEFORE DELETE ON member_assignments FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE TRIGGER transfer_preserve_history BEFORE DELETE ON member_transfers FOR EACH STATEMENT EXECUTE FUNCTION hwf_reject_mutation();
CREATE FUNCTION hwf_session_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.issued_at<>OLD.issued_at OR NEW.absolute_expires_at<>OLD.absolute_expires_at OR NEW.staff_id<>OLD.staff_id OR (OLD.revoked_at IS NOT NULL AND NEW.revoked_at IS DISTINCT FROM OLD.revoked_at) OR (OLD.idle_expires_at<=clock_timestamp() AND NEW.idle_expires_at>OLD.idle_expires_at) THEN RAISE EXCEPTION 'session cannot revive or extend absolute lifetime' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER session_lifetime_guard BEFORE UPDATE ON staff_sessions FOR EACH ROW EXECUTE FUNCTION hwf_session_guard();

ALTER TABLE volunteer_applications ADD CONSTRAINT decline_reason_required CHECK (status<>'DECLINED' OR decline_reason IS NOT NULL AND length(btrim(decline_reason))>0);
CREATE FUNCTION hwf_member_acceptance() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM volunteer_applications WHERE id=NEW.application_id AND status='ACCEPTED') THEN RAISE EXCEPTION 'member must commit with accepted application' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER member_initial_acceptance AFTER INSERT ON members DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_member_acceptance();
CREATE FUNCTION hwf_acceptance_member_effect() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='ACCEPTED' AND OLD.status<>'ACCEPTED' AND NOT EXISTS(SELECT 1 FROM members WHERE application_id=NEW.id AND status='ACTIVE') THEN RAISE EXCEPTION 'acceptance requires Active linked member' USING ERRCODE='23514'; END IF;
 IF OLD.status='ACCEPTED' AND NEW.status='PENDING' AND NOT EXISTS(SELECT 1 FROM members WHERE application_id=NEW.id AND status='INACTIVE') THEN RAISE EXCEPTION 'accepted reversal must inactivate original member atomically' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER application_member_effect AFTER UPDATE ON volunteer_applications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION hwf_acceptance_member_effect();

ALTER TABLE collections ADD CONSTRAINT collections_amount_finite CHECK (amount::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE financial_adjustments ADD CONSTRAINT financial_adjustments_amount_finite CHECK (amount::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE remittances ADD CONSTRAINT remittances_amount_finite CHECK (amount::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE remittance_reservations ADD CONSTRAINT remittance_reservations_amount_finite CHECK (amount::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_gross_collections_finite CHECK (gross_collections::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_recognized_adjustments_finite CHECK (recognized_adjustments::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_net_recognized_finite CHECK (net_recognized::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_confirmed_remittances_finite CHECK (confirmed_remittances::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_pending_reservations_finite CHECK (pending_reservations::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_signed_outstanding_finite CHECK (signed_outstanding::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_reconciliation_deficit_finite CHECK (reconciliation_deficit::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_revisions ADD CONSTRAINT report_revisions_available_to_remit_finite CHECK (available_to_remit::text NOT IN ('NaN','Infinity','-Infinity'));
ALTER TABLE report_lines ADD CONSTRAINT report_lines_amount_finite CHECK (amount::text NOT IN ('NaN','Infinity','-Infinity'));

-- Safe reference identities only: no staff credentials, financial fixtures or invented editorial copy.
INSERT INTO cms_items(id,kind,page,slug) VALUES
(gen_random_uuid(),'PAGE','HOME','home'),(gen_random_uuid(),'PAGE','ABOUT','about'),
(gen_random_uuid(),'PAGE','PROGRAMS','programs'),(gen_random_uuid(),'PAGE','BRANCHES','branches'),
(gen_random_uuid(),'PAGE','EVENTS','events'),(gen_random_uuid(),'PAGE','GET_INVOLVED','get-involved'),
(gen_random_uuid(),'PAGE','CONTACT','contact');
COMMIT;
