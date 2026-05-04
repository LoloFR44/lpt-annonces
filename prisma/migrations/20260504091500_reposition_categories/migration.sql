-- Repositioning of the marketplace from "petites annonces" to "opportunités
-- entrepreneuriales". Renames preserve every existing row (Postgres 12+
-- ALTER TYPE ... RENAME VALUE is non-destructive).
--
-- The MATERIEL value is kept around in the enum but tagged "legacy" in the
-- Prisma schema; new submissions use LOCAUX_RESSOURCES, which now covers
-- both bureaux/coworking and matériel/équipements.

ALTER TYPE "Category" RENAME VALUE 'CESSION'     TO 'CESSION_REPRISE';
ALTER TYPE "Category" RENAME VALUE 'PARTENARIAT' TO 'PARTENARIATS_DISTRIBUTION';
ALTER TYPE "Category" RENAME VALUE 'FREELANCE'   TO 'MISSIONS_EXPERTS';
ALTER TYPE "Category" RENAME VALUE 'LOCAUX'      TO 'LOCAUX_RESSOURCES';

-- New value introduced for "Associés & cofondateurs". Postgres requires this
-- to be on its own statement (no other transactional changes after).
ALTER TYPE "Category" ADD VALUE IF NOT EXISTS 'ASSOCIES_COFONDATEURS' BEFORE 'RECRUTEMENT';
