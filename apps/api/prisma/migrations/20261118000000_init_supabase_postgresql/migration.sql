-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'NEEDS_REVISION', 'REJECTED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('SUBSECTOR', 'SUBAPP_TYPE', 'WORK_CATEGORY', 'PRODUCT_TYPE');

-- CreateEnum
CREATE TYPE "ProductAvailability" AS ENUM ('AVAILABLE', 'MADE_TO_ORDER', 'UNAVAILABLE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "locationText" TEXT,
    "photoPath" TEXT,
    "bio" VARCHAR(500),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfileInterest" (
    "userProfileId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfileInterest_pkey" PRIMARY KEY ("userProfileId","categoryId")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "revokedAt" TIMESTAMPTZ,
    "replacedBySessionId" UUID,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "CategoryKind" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubApp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "imagePath" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubApp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAppCategory" (
    "subAppId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "SubAppCategory_pkey" PRIMARY KEY ("subAppId","categoryId")
);

-- CreateTable
CREATE TABLE "CreativeProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
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
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeProfileCategory" (
    "creativeProfileId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "CreativeProfileCategory_pkey" PRIMARY KEY ("creativeProfileId","categoryId")
);

-- CreateTable
CREATE TABLE "CreativeProfileOwner" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creativeProfileId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeProfileOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeWork" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creativeProfileId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imagePaths" TEXT NOT NULL DEFAULT '[]',
    "technique" TEXT,
    "motif" TEXT,
    "year" INTEGER,
    "categoryId" UUID,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMPTZ,
    "reviewedAt" TIMESTAMPTZ,
    "reviewedById" UUID,
    "publishedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeWork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeProduct" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "creativeProfileId" UUID NOT NULL,
    "workId" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imagePaths" TEXT NOT NULL DEFAULT '[]',
    "productTypeId" UUID NOT NULL,
    "material" TEXT,
    "dimensions" TEXT,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "priceUnit" VARCHAR(30),
    "availability" "ProductAvailability" NOT NULL DEFAULT 'AVAILABLE',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewNote" TEXT,
    "submittedAt" TIMESTAMPTZ,
    "reviewedAt" TIMESTAMPTZ,
    "reviewedById" UUID,
    "publishedAt" TIMESTAMPTZ,
    "archivedAt" TIMESTAMPTZ,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreativeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "idx_session_user" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "idx_session_family" ON "AuthSession"("familyId");

-- CreateIndex
CREATE INDEX "idx_session_expires" ON "AuthSession"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_category_lookup" ON "Category"("kind", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_kind_slug" ON "Category"("kind", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "uq_category_kind_name" ON "Category"("kind", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SubApp_slug_key" ON "SubApp"("slug");

-- CreateIndex
CREATE INDEX "idx_subapp_status_published" ON "SubApp"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_subapp_status_name" ON "SubApp"("status", "name");

-- CreateIndex
CREATE INDEX "idx_subapp_category" ON "SubAppCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeProfile_slug_key" ON "CreativeProfile"("slug");

-- CreateIndex
CREATE INDEX "idx_creative_status_published" ON "CreativeProfile"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_creative_status_city" ON "CreativeProfile"("status", "city");

-- CreateIndex
CREATE INDEX "idx_creative_status_district" ON "CreativeProfile"("status", "district");

-- CreateIndex
CREATE INDEX "idx_creative_category" ON "CreativeProfileCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeProfileOwner_creativeProfileId_key" ON "CreativeProfileOwner"("creativeProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeProfileOwner_userId_key" ON "CreativeProfileOwner"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeWork_slug_key" ON "CreativeWork"("slug");

-- CreateIndex
CREATE INDEX "idx_work_status_published" ON "CreativeWork"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_work_creator_status" ON "CreativeWork"("creativeProfileId", "status");

-- CreateIndex
CREATE INDEX "idx_work_category" ON "CreativeWork"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CreativeProduct_slug_key" ON "CreativeProduct"("slug");

-- CreateIndex
CREATE INDEX "idx_prod_status_published" ON "CreativeProduct"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_prod_creator_status" ON "CreativeProduct"("creativeProfileId", "status");

-- CreateIndex
CREATE INDEX "idx_prod_type" ON "CreativeProduct"("productTypeId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileInterest" ADD CONSTRAINT "UserProfileInterest_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfileInterest" ADD CONSTRAINT "UserProfileInterest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubApp" ADD CONSTRAINT "SubApp_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubApp" ADD CONSTRAINT "SubApp_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAppCategory" ADD CONSTRAINT "SubAppCategory_subAppId_fkey" FOREIGN KEY ("subAppId") REFERENCES "SubApp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAppCategory" ADD CONSTRAINT "SubAppCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfile" ADD CONSTRAINT "CreativeProfile_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfile" ADD CONSTRAINT "CreativeProfile_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfileCategory" ADD CONSTRAINT "CreativeProfileCategory_creativeProfileId_fkey" FOREIGN KEY ("creativeProfileId") REFERENCES "CreativeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfileCategory" ADD CONSTRAINT "CreativeProfileCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfileOwner" ADD CONSTRAINT "CreativeProfileOwner_creativeProfileId_fkey" FOREIGN KEY ("creativeProfileId") REFERENCES "CreativeProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfileOwner" ADD CONSTRAINT "CreativeProfileOwner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProfileOwner" ADD CONSTRAINT "CreativeProfileOwner_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeWork" ADD CONSTRAINT "CreativeWork_creativeProfileId_fkey" FOREIGN KEY ("creativeProfileId") REFERENCES "CreativeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeWork" ADD CONSTRAINT "CreativeWork_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeWork" ADD CONSTRAINT "CreativeWork_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeWork" ADD CONSTRAINT "CreativeWork_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeWork" ADD CONSTRAINT "CreativeWork_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_creativeProfileId_fkey" FOREIGN KEY ("creativeProfileId") REFERENCES "CreativeProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_workId_fkey" FOREIGN KEY ("workId") REFERENCES "CreativeWork"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "CreativeProduct_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business Logic & Integrity Check Constraints
ALTER TABLE "User" ADD CONSTRAINT "chk_user_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "SubApp" ADD CONSTRAINT "chk_subapp_url" CHECK ("externalUrl" ~* '^https?://');
ALTER TABLE "SubApp" ADD CONSTRAINT "chk_subapp_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "SubApp" ADD CONSTRAINT "chk_subapp_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL);
ALTER TABLE "CreativeProfile" ADD CONSTRAINT "chk_creative_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "CreativeProfile" ADD CONSTRAINT "chk_creative_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL);
ALTER TABLE "CreativeWork" ADD CONSTRAINT "chk_work_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "CreativeWork" ADD CONSTRAINT "chk_work_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL);
ALTER TABLE "CreativeWork" ADD CONSTRAINT "chk_work_review_note" CHECK ("status" NOT IN ('REJECTED', 'NEEDS_REVISION') OR ("reviewNote" IS NOT NULL AND length(trim("reviewNote")) > 0));
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "chk_prod_published" CHECK ("status" != 'PUBLISHED' OR "publishedAt" IS NOT NULL);
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "chk_prod_archived" CHECK ("status" != 'ARCHIVED' OR "archivedAt" IS NOT NULL);
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "chk_prod_price" CHECK ("priceMin" IS NULL OR "priceMax" IS NULL OR "priceMax" >= "priceMin");
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "chk_prod_price_positive" CHECK (("priceMin" IS NULL OR "priceMin" >= 0) AND ("priceMax" IS NULL OR "priceMax" >= 0));
ALTER TABLE "CreativeProduct" ADD CONSTRAINT "chk_prod_review_note" CHECK ("status" NOT IN ('REJECTED', 'NEEDS_REVISION') OR ("reviewNote" IS NOT NULL AND length(trim("reviewNote")) > 0));

