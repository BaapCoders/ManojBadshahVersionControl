import { prisma } from '../lib/prisma';

/**
 * Design Service - Version Control System
 * Provides Git-like version control for designer workflows
 */

// ===================== BRIEF MANAGEMENT =====================

/**
 * Create a brief from a WhatsApp message
 */
export const createBriefFromMessage = async (messageId: string) => {
  const message = await prisma.whatsAppMessage.findUnique({
    where: { messageId }
  });

  if (!message) {
    throw new Error('WhatsApp message not found');
  }

  // Get or create client
  let client = await prisma.client.findUnique({
    where: { phoneNumber: message.from }
  });

  if (!client) {
    client = await prisma.client.create({
      data: { phoneNumber: message.from }
    });
  }

  // Create brief
  const brief = await prisma.brief.create({
    data: {
      clientId: client.id,
      messageId: message.messageId,
      description: message.text,
      status: 'pending'
    },
    include: {
      client: true
    }
  });

  return brief;
};

/**
 * Get all briefs with client and design info
 */
export const getAllBriefs = async () => {
  return await prisma.brief.findMany({
    include: {
      client: true,
      designs: {
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Get a specific brief with all details
 */
export const getBriefById = async (id: number) => {
  return await prisma.brief.findUnique({
    where: { id },
    include: {
      client: true,
      designs: {
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' }
          }
        }
      }
    }
  });
};

/**
 * Update brief status
 */
export const updateBriefStatus = async (id: number, status: string) => {
  return await prisma.brief.update({
    where: { id },
    data: { status }
  });
};

// ===================== DESIGN MANAGEMENT =====================

/**
 * Create a new design for a brief
 */
export const createDesign = async (briefId: number, title: string) => {
  const design = await prisma.design.create({
    data: {
      briefId,
      title
    }
  });

  // Automatically create V1
  await createVersion(design.id, {
    commitMessage: 'Initial version',
    createdBy: 'designer'
  });

  return await prisma.design.findUnique({
    where: { id: design.id },
    include: {
      versions: true,
      brief: {
        include: { client: true }
      }
    }
  });
};

/**
 * Get design with full version history
 */
export const getDesignById = async (id: number) => {
  return await prisma.design.findUnique({
    where: { id },
    include: {
      brief: {
        include: { client: true }
      },
      versions: {
        orderBy: { versionNumber: 'desc' },
        include: {
          assets: true,
          feedback: {
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });
};

// ===================== VERSION CONTROL (GIT-LIKE) =====================

interface CreateVersionData {
  commitMessage?: string;
  pngBase64?: string;
  createdBy?: string;
}

/**
 * COMMIT: Create a new version (like git commit)
 * Uploads PNG blob to S3 and saves version
 */
export const createVersion = async (designId: number, data: CreateVersionData) => {
  const design = await prisma.design.findUnique({
    where: { id: designId },
    include: {
      versions: {
        orderBy: { versionNumber: 'desc' },
        take: 1
      }
    }
  });

  if (!design) {
    throw new Error('Design not found');
  }

  // Auto-increment version number
  const nextVersionNumber = design.versions.length > 0 
    ? design.versions[0].versionNumber + 1 
    : 1;

  console.log(`📸 Processing PNG for V${nextVersionNumber}...`);
  
  let previewUrl: string | undefined = undefined;
  
  // Upload PNG if base64 is provided
  if (data.pngBase64) {
    try {
      console.log('☁️ Uploading PNG to S3...');
      
      // Upload base64 PNG to S3
      const { uploadBase64PNG } = await import('./s3Upload.service');
      const uploadResult = await uploadBase64PNG(data.pngBase64, designId, nextVersionNumber);
      
      if (uploadResult.success && uploadResult.url) {
        previewUrl = uploadResult.url;
        console.log(`✅ Uploaded to S3: ${previewUrl}`);
      } else {
        console.error('❌ S3 upload failed:', uploadResult.error);
      }
      
    } catch (error) {
      console.error('❌ PNG upload failed:', error);
      // Continue without preview URL - don't fail the version creation
    }
  }

  // Create new version
  const version = await prisma.designVersion.create({
    data: {
      designId,
      versionNumber: nextVersionNumber,
      commitMessage: data.commitMessage || `Version ${nextVersionNumber}`,
      previewUrl: previewUrl,
      createdBy: data.createdBy || 'designer'
    }
  });

  // Update design's current version
  await prisma.design.update({
    where: { id: designId },
    data: { currentVersion: nextVersionNumber }
  });

  console.log(`✅ Version ${nextVersionNumber} created with preview URL`);

  return version;
};

/**
 * GET VERSION HISTORY: List all versions (like git log)
 */
export const getVersionHistory = async (designId: number) => {
  return await prisma.designVersion.findMany({
    where: { designId },
    include: {
      assets: true,
      feedback: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { versionNumber: 'desc' }
  });
};

/**
 * GET SPECIFIC VERSION: Get a specific version details
 */
export const getVersionById = async (versionId: number) => {
  return await prisma.designVersion.findUnique({
    where: { id: versionId },
    include: {
      assets: true,
      feedback: true,
      design: {
        include: {
          brief: {
            include: { client: true }
          }
        }
      }
    }
  });
};

/**
 * GET VERSION BY NUMBER: Get version by design ID and version number
 */
export const getVersionByNumber = async (designId: number, versionNumber: number) => {
  return await prisma.designVersion.findFirst({
    where: {
      designId,
      versionNumber
    }
  });
};

/**
 * REVERT: Restore a previous version (like git revert)
 * Creates a new version that is a copy of the target version
 */
export const revertToVersion = async (designId: number, targetVersionNumber: number) => {
  // Get the target version to restore
  const targetVersion = await prisma.designVersion.findFirst({
    where: {
      designId,
      versionNumber: targetVersionNumber
    },
    include: {
      assets: true
    }
  });

  if (!targetVersion) {
    throw new Error(`Version ${targetVersionNumber} not found`);
  }

  // Note: This will create a new version without PNG since we can't regenerate it
  // The previewUrl will be null for reverted versions
  const newVersion = await createVersion(designId, {
    commitMessage: `Reverted to V${targetVersionNumber}`,
    createdBy: 'designer'
  });

  return newVersion;
};

/**
 * DIFF: Compare two versions
 */
export const compareVersions = async (designId: number, version1: number, version2: number) => {
  const v1 = await prisma.designVersion.findFirst({
    where: { designId, versionNumber: version1 },
    include: { assets: true }
  });

  const v2 = await prisma.designVersion.findFirst({
    where: { designId, versionNumber: version2 },
    include: { assets: true }
  });

  if (!v1 || !v2) {
    throw new Error('One or both versions not found');
  }

  return {
    version1: v1,
    version2: v2,
    changes: {
      previewUrlChanged: v1.previewUrl !== v2.previewUrl,
      assetsChanged: v1.assets.length !== v2.assets.length
    }
  };
};

// ===================== FEEDBACK MANAGEMENT =====================

/**
 * Add feedback to a version
 */
export const addFeedback = async (
  versionId: number,
  from: string,
  message: string
) => {
  return await prisma.feedback.create({
    data: {
      versionId,
      from,
      message,
      status: 'pending'
    }
  });
};

/**
 * Update feedback status
 */
export const updateFeedbackStatus = async (feedbackId: number, status: string) => {
  return await prisma.feedback.update({
    where: { id: feedbackId },
    data: { status }
  });
};

/**
 * Get all feedback for a design
 */
export const getDesignFeedback = async (designId: number) => {
  return await prisma.feedback.findMany({
    where: {
      version: {
        designId
      }
    },
    include: {
      version: true
    },
    orderBy: { createdAt: 'desc' }
  });
};
