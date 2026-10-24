CREATE TABLE "foundation_markers" (
  "id" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "foundation_markers_pkey" PRIMARY KEY ("id")
);
