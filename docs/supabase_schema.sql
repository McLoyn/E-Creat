-- ==============================================================================
-- Ekraf HUB V0.1 — Supabase / PostgreSQL Schema DDL
-- Compatible with Supabase SQL Editor and Prisma PostgreSQL
-- ==============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CategoryKind" AS ENUM ('SUBSECTOR', 'SUBAPP_TYPE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. User
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

-- 2. UserProfile
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

-- 4. UserProfileInterest
CREATE TABLE IF NOT EXISTS "UserProfileInterest" (
  "userProfileId" UUID NOT NULL REFERENCES "UserProfile"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("userProfileId", "categoryId")
);

-- 5. AuthSession
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

-- 6. SubApp
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

-- 7. SubAppCategory
CREATE TABLE IF NOT EXISTS "SubAppCategory" (
  "subAppId" UUID NOT NULL REFERENCES "SubApp"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("subAppId", "categoryId")
);
CREATE INDEX IF NOT EXISTS "idx_subapp_category" ON "SubAppCategory"("categoryId");

-- 8. CreativeProfile (No FK to User or UserProfile as required)
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

-- 9. CreativeProfileCategory
CREATE TABLE IF NOT EXISTS "CreativeProfileCategory" (
  "creativeProfileId" UUID NOT NULL REFERENCES "CreativeProfile"("id") ON DELETE CASCADE,
  "categoryId" UUID NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
  PRIMARY KEY ("creativeProfileId", "categoryId")
);
CREATE INDEX IF NOT EXISTS "idx_creative_category" ON "CreativeProfileCategory"("categoryId");
