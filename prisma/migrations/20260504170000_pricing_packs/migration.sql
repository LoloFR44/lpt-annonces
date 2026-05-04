-- New pricing model — 3 paid packs × 2 durations + Free.
-- Existing PREMIUM annonces (legacy 49€ flow) keep their value; the UI
-- now sources Boost/Pro/Ultra from new enum entries instead.

ALTER TYPE "AnnoncePlan" ADD VALUE IF NOT EXISTS 'BOOST' AFTER 'FREE';
ALTER TYPE "AnnoncePlan" ADD VALUE IF NOT EXISTS 'PRO'   AFTER 'BOOST';
ALTER TYPE "AnnoncePlan" ADD VALUE IF NOT EXISTS 'ULTRA' AFTER 'PRO';

-- New column with a sane default so existing rows are valid.
ALTER TABLE "Annonce" ADD COLUMN IF NOT EXISTS "durationDays" INTEGER NOT NULL DEFAULT 30;

-- Backfill: legacy PREMIUM rows were 90-day windows.
UPDATE "Annonce" SET "durationDays" = 90 WHERE "plan" = 'PREMIUM';
