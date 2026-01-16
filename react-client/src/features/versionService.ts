// @ts-ignore
// import addOnUISdk from "add-on-ui-sdk";
import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";
import { API_URL } from '../config/env';

const API_BASE_URL = `${API_URL}/api`;

/**
 * Version Control Service
 * PNG Export → S3 Storage → View Thumbnails
 */

export interface VersionData {
  versionNumber: number;
  commitMessage?: string;
  adobeProjectId?: string;
  previewUrl?: string;
  serializedState?: string;
}

export interface DesignVersion {
  id: number;
  designId: number;
  versionNumber: number;
  commitMessage: string | null;
  previewUrl: string | null;
  createdBy: string;
  createdAt: string;
}

export interface SaveVersionResult {
  success: boolean;
  version?: DesignVersion;
  error?: string;
}

/**
 * Save current canvas as a new version
 * REDESIGNED: Export PNG blob → Upload to S3 → Save version
 * @param designId - The design ID to save version for
 * @param commitMessage - Optional commit message
 * @returns Save result with version data
 */
export const saveAsNewVersion = async (
  designId: number,
  commitMessage?: string
): Promise<SaveVersionResult> => {
  try {
    console.log(`💾 Saving new version for design ${designId}...`);

    // Get current version number from backend
    const versionsResponse = await fetch(`${API_BASE_URL}/designs/${designId}/versions`);
    if (!versionsResponse.ok) {
      throw new Error('Failed to fetch current versions');
    }
    const versions: DesignVersion[] = await versionsResponse.json();
    const nextVersionNumber = versions.length + 1;

    // Export current page as PNG using Adobe's native API
    console.log('📸 Exporting poster as PNG...');
    const renditions = await addOnUISdk.app.document.createRenditions(
      {
        range: addOnUISdk.constants.Range.currentPage,
        format: addOnUISdk.constants.RenditionFormat.png,
      },
      addOnUISdk.constants.RenditionIntent.export
    );

    if (!renditions || renditions.length === 0) {
      throw new Error('Failed to create PNG rendition');
    }

    const pngBlob = renditions[0].blob;
    console.log(`✅ PNG exported: ${pngBlob.size} bytes (${pngBlob.type})`);

    // Convert blob to base64 for backend upload
    console.log('🔄 Converting blob to base64...');
    const base64PNG = await blobToBase64(pngBlob);

    // Save to backend (backend will upload PNG to S3)
    console.log('☁️ Uploading to S3 via backend...');
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commitMessage: commitMessage || `Version ${nextVersionNumber}`,
        pngBase64: base64PNG,
        createdBy: 'designer'
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save version to backend');
    }

    const savedVersion: DesignVersion = await response.json();

    console.log(`✅ Version ${nextVersionNumber} saved with preview URL: ${savedVersion.previewUrl}`);

    return {
      success: true,
      version: savedVersion,
    };
  } catch (error) {
    console.error('❌ Failed to save version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Convert blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Load version history for a design
 * @param designId - The design ID
 * @returns Array of versions
 */
export const loadVersionHistory = async (designId: number): Promise<DesignVersion[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch version history');
    }
    const versions: DesignVersion[] = await response.json();
    return versions;
  } catch (error) {
    console.error('❌ Failed to load version history:', error);
    return [];
  }
};

/**
 * Get version PNG URL for viewing
 * @param designId - The design ID
 * @param versionNumber - The version number
 * @returns PNG URL or null
 */
export const getVersionPNG = async (designId: number, versionNumber: number): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions`);
    if (!response.ok) {
      throw new Error('Failed to fetch version data');
    }

    const versions: DesignVersion[] = await response.json();
    const targetVersion = versions.find(v => v.versionNumber === versionNumber);

    return targetVersion?.previewUrl || null;
  } catch (error) {
    console.error('❌ Failed to get version PNG:', error);
    return null;
  }
};

/**
 * Restore version by importing PNG to canvas with automatic page resize
 * @param designId - The design ID
 * @param versionNumber - The version number
 * @returns Success status
 */
export const restoreVersionToCanvas = async (designId: number, versionNumber: number): Promise<boolean> => {
  try {
    console.log(`🔄 Restoring V${versionNumber} to canvas...`);
    
    // Fetch PNG through backend proxy (bypasses CORS)
    const proxyUrl = `${API_BASE_URL}/designs/${designId}/versions/${versionNumber}/png`;
    console.log('📥 Downloading PNG via backend proxy...');
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PNG: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`✅ Downloaded: ${blob.size} bytes`);

    // Import to canvas with automatic page resize to match image dimensions
    console.log('🎨 Adding image to canvas and resizing page...');
    
    // Get the document sandbox API proxy through the UI SDK's runtime
    // @ts-ignore
    const sandboxProxy = await addOnUISdk.instance.runtime.apiProxy("documentSandbox");
    const result = await sandboxProxy.importImageWithPageResize(blob);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to import image');
    }
    
    console.log('✅ Image added to canvas successfully with page resized!');

    return true;
  } catch (error) {
    console.error('❌ Failed to restore version:', error);
    throw error;
  }
};

/**
 * Get feedback for a design
 * @param designId - The design ID
 * @returns Array of feedback items
 */
export const loadFeedback = async (designId: number): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/feedback`);
    if (!response.ok) {
      throw new Error('Failed to fetch feedback');
    }
    return await response.json();
  } catch (error) {
    console.error('❌ Failed to load feedback:', error);
    return [];
  }
};

/**
 * Update feedback status
 * @param feedbackId - The feedback ID
 * @param status - New status (pending, applied, ignored)
 */
export const updateFeedbackStatus = async (
  feedbackId: number,
  status: 'pending' | 'applied' | 'ignored'
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback/${feedbackId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.ok;
  } catch (error) {
    console.error('❌ Failed to update feedback status:', error);
    return false;
  }
};

/**
 * Delete a version and its PNG from S3
 * @param designId - The design ID
 * @param versionNumber - The version number to delete
 * @returns Success status
 */
export const deleteVersion = async (designId: number, versionNumber: number): Promise<boolean> => {
  try {
    console.log(`🗑️ Deleting version ${versionNumber} for design ${designId}...`);
    
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions/${versionNumber}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete version');
    }

    console.log(`✅ Version ${versionNumber} deleted successfully`);
    return true;
  } catch (error) {
    console.error('❌ Failed to delete version:', error);
    return false;
  }
};
