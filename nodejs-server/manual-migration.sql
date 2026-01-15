-- Migration: Add Version Control Models
-- Run this SQL manually on your database if automatic migration fails

-- ===================== CLIENT =====================
CREATE TABLE IF NOT EXISTS "Client" (
    "id" SERIAL PRIMARY KEY,
    "phoneNumber" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================== BRIEF =====================
CREATE TABLE IF NOT EXISTS "Brief" (
    "id" SERIAL PRIMARY KEY,
    "clientId" INTEGER NOT NULL,
    "messageId" TEXT NOT NULL UNIQUE,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brief_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===================== DESIGN =====================
CREATE TABLE IF NOT EXISTS "Design" (
    "id" SERIAL PRIMARY KEY,
    "briefId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Design_briefId_fkey" FOREIGN KEY ("briefId") REFERENCES "Brief"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===================== DESIGN VERSION =====================
CREATE TABLE IF NOT EXISTS "DesignVersion" (
    "id" SERIAL PRIMARY KEY,
    "designId" INTEGER NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "commitMessage" TEXT,
    "adobeProjectId" TEXT,
    "previewUrl" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'designer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DesignVersion_designId_versionNumber_key" UNIQUE ("designId", "versionNumber")
);

-- ===================== ASSET =====================
CREATE TABLE IF NOT EXISTS "Asset" (
    "id" SERIAL PRIMARY KEY,
    "versionId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ===================== FEEDBACK =====================
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" SERIAL PRIMARY KEY,
    "versionId" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "Brief_clientId_idx" ON "Brief"("clientId");
CREATE INDEX IF NOT EXISTS "Brief_messageId_idx" ON "Brief"("messageId");
CREATE INDEX IF NOT EXISTS "Design_briefId_idx" ON "Design"("briefId");
CREATE INDEX IF NOT EXISTS "DesignVersion_designId_idx" ON "DesignVersion"("designId");
CREATE INDEX IF NOT EXISTS "Asset_versionId_idx" ON "Asset"("versionId");
CREATE INDEX IF NOT EXISTS "Feedback_versionId_idx" ON "Feedback"("versionId");
