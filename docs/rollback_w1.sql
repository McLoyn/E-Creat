-- ==============================================================================
-- Ekraf HUB — Rollback Script for Workstream W1 (Showcase & Pasar)
-- Safe undo of additive tables, reverse order of dependencies
-- ==============================================================================

-- 1. Drop Pasar Products
DROP TABLE IF EXISTS "CreativeProduct" CASCADE;

-- 2. Drop Showcase Works
DROP TABLE IF EXISTS "CreativeWork" CASCADE;

-- 3. Drop Owner Link
DROP TABLE IF EXISTS "CreativeProfileOwner" CASCADE;

-- 4. Delete new Category kinds if added
DELETE FROM "Category" WHERE "kind" IN ('WORK_CATEGORY', 'PRODUCT_TYPE');

-- 5. Drop added types if no longer used
-- DO $$ BEGIN
--   DROP TYPE IF EXISTS "ProductAvailability";
-- EXCEPTION WHEN others THEN null;
-- END $$;
