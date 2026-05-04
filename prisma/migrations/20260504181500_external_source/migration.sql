-- Provenance for auto-imported annonces. Nullable so existing rows stay valid;
-- the partial unique index ensures (source, externalId) collisions are blocked
-- only when both fields are populated, leaving native LPT annonces unaffected.

ALTER TABLE "Annonce" ADD COLUMN IF NOT EXISTS "externalSource" TEXT;
ALTER TABLE "Annonce" ADD COLUMN IF NOT EXISTS "externalId"     TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Annonce_externalSource_externalId_key"
  ON "Annonce"("externalSource", "externalId")
  WHERE "externalSource" IS NOT NULL AND "externalId" IS NOT NULL;
