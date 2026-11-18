-- ==============================================================================
-- Ekraf HUB V0.1 — Supabase / PostgreSQL Schema DDL (Additive W1: Showcase & Pasar)
-- Compatible with Supabase SQL Editor and Prisma PostgreSQL
-- ==============================================================================

-- 1. Enums & Extensions
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'REJECTED', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CategoryKind" AS ENUM ('SUBSECTOR', 'SUBAPP_TYPE', 'WORK_CATEGORY', 'PRODUCT_TYPE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'MADE_TO_ORDER', 'UNAVAILABLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. User & UserProfile
CREATE TABLE IF NOT EXISTS "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'USER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_user_email_lowercase" CHECK ("email" = lower("email"))
);

CREATE TABLE IF NOT EXISTS "UserProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "displayName" TEXT NOT NULL,
  "locationText" TEXT,
  "photoPath" TEXT,
  "bio" VARCHAR(500),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Category
CREATE TABLE IF NOT EXISTS "Category" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" "CategoryKind" NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INT NOT NULL DEFAULT 0,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "uq_category_kind_slug" UNIQUE ("kind", "slug"),
  CONSTRAINT "uq_category_kind_name" UNIQUE ("kind", "name")
);
CREATE INDEX IF NOT EXISTS "idx_category_lookup" ON "Category"("kind", "isActive", "sortOrder");

CREATE TABLE IF NOT EXISTS "UserProfileInterest" (
  "userProfileId" UUID NOT NULL REFERENCES "UserProfile"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("userProfileId", "categoryId")
);

-- 4. AuthSession
CREATE TABLE IF NOT EXISTS "AuthSession" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "familyId" UUID NOT NULL,
  "refreshTokenHash" TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "replacedBySessionId" UUID,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "idx_session_user" ON "AuthSession"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_family" ON "AuthSession"("familyId");
CREATE INDEX IF NOT EXISTS "idx_session_expires" ON "AuthSession"("expiresAt");

-- 5. SubApp & SubAppCategory
CREATE TABLE IF NOT EXISTS "SubApp" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "tagline" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "externalUrl" TEXT NOT NULL,
  "imagePath" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_subapp_url" CHECK ("externalUrl" ~* '^https?://'),
  CONSTRAINT "chk_subapp_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL),
  CONSTRAINT "chk_subapp_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "idx_subapp_status_published" ON "SubApp"("status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_subapp_status_name" ON "SubApp"("status", "name");

CREATE TABLE IF NOT EXISTS "SubAppCategory" (
  "subAppId" UUID NOT NULL REFERENCES "SubApp"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("subAppId", "categoryId")
);
CREATE INDEX IF NOT EXISTS "idx_subapp_category" ON "SubAppCategory"("categoryId");

-- 6. CreativeProfile & CreativeProfileCategory
CREATE TABLE IF NOT EXISTS "CreativeProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "district" TEXT,
  "imagePath" TEXT,
  "websiteUrl" TEXT,
  "instagramHandle" TEXT,
  "whatsappNumber" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_creative_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL),
  CONSTRAINT "chk_creative_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "idx_creative_status_published" ON "CreativeProfile"("status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_creative_status_city" ON "CreativeProfile"("status", "city");
CREATE INDEX IF NOT EXISTS "idx_creative_status_district" ON "CreativeProfile"("status", "district");

CREATE TABLE IF NOT EXISTS "CreativeProfileCategory" (
  "creativeProfileId" UUID NOT NULL REFERENCES "CreativeProfile"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("creativeProfileId", "categoryId")
);
CREATE INDEX IF NOT EXISTS "idx_creative_category" ON "CreativeProfileCategory"("categoryId");

-- 7. K-01: CreativeProfileOwner (Additive)
CREATE TABLE IF NOT EXISTS "CreativeProfileOwner" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creativeProfileId" UUID UNIQUE NOT NULL REFERENCES "CreativeProfile"("id") ON DELETE CASCADE,
  "userId" UUID UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "assignedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. CreativeWork (Showcase Additive)
CREATE TABLE IF NOT EXISTS "CreativeWork" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creativeProfileId" UUID NOT NULL REFERENCES "CreativeProfile"("id") ON DELETE RESTRICT,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "imagePaths" TEXT NOT NULL DEFAULT '[]',
  "technique" TEXT,
  "motif" TEXT,
  "year" INT,
  "categoryId" UUID REFERENCES "Category"("id") ON DELETE SET NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewNote" TEXT,
  "submittedAt" TIMESTAMPTZ,
  "reviewedAt" TIMESTAMPTZ,
  "reviewedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_work_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL),
  CONSTRAINT "chk_work_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL),
  CONSTRAINT "chk_work_review_note" CHECK ("status" NOT IN ('REJECTED', 'NEEDS_REVISION') OR ("reviewNote" IS NOT NULL AND length(trim("reviewNote")) > 0))
);
CREATE INDEX IF NOT EXISTS "idx_work_status_published" ON "CreativeWork"("status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_work_creator_status" ON "CreativeWork"("creativeProfileId", "status");
CREATE INDEX IF NOT EXISTS "idx_work_category" ON "CreativeWork"("categoryId");

-- 9. CreativeProduct (Pasar Additive)
CREATE TABLE IF NOT EXISTS "CreativeProduct" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "creativeProfileId" UUID NOT NULL REFERENCES "CreativeProfile"("id") ON DELETE RESTRICT,
  "workId" UUID REFERENCES "CreativeWork"("id") ON DELETE SET NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT UNIQUE NOT NULL,
  "description" TEXT NOT NULL,
  "imagePaths" TEXT NOT NULL DEFAULT '[]',
  "productTypeId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  "material" TEXT,
  "dimensions" TEXT,
  "priceMin" INT,
  "priceMax" INT,
  "priceUnit" VARCHAR(30),
  "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "reviewNote" TEXT,
  "submittedAt" TIMESTAMPTZ,
  "reviewedAt" TIMESTAMPTZ,
  "reviewedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "publishedAt" TIMESTAMPTZ,
  "archivedAt" TIMESTAMPTZ,
  "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "updatedById" UUID REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "chk_prod_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL),
  CONSTRAINT "chk_prod_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL),
  CONSTRAINT "chk_prod_price" CHECK ("priceMin" IS NULL OR "priceMax" IS NULL OR "priceMax" >= "priceMin"),
  CONSTRAINT "chk_prod_price_positive" CHECK (("priceMin" IS NULL OR "priceMin" >= 0) AND ("priceMax" IS NULL OR "priceMax" >= 0)),
  CONSTRAINT "chk_prod_review_note" CHECK ("status" NOT IN ('REJECTED', 'NEEDS_REVISION') OR ("reviewNote" IS NOT NULL AND length(trim("reviewNote")) > 0))
);
CREATE INDEX IF NOT EXISTS "idx_prod_status_published" ON "CreativeProduct"("status", "publishedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_prod_creator_status" ON "CreativeProduct"("creativeProfileId", "status");
CREATE INDEX IF NOT EXISTS "idx_prod_type" ON "CreativeProduct"("productTypeId");
