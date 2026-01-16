// @ts-ignore
import addOnUISdk from "add-on-ui-sdk";

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Version Control Service
 * Integrates Adobe Express Document Sandbox APIs with backend version management
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
  adobeProjectId: string | null;
  previewUrl: string | null;
  serializedState: string | null;
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

    // Get the document sandbox proxy
    const sandbox = await addOnUISdk.instance.runtime.apiProxy("documentSandbox");

    // Get current version number from backend
    const versionsResponse = await fetch(`${API_BASE_URL}/designs/${designId}/versions`);
    if (!versionsResponse.ok) {
      throw new Error('Failed to fetch current versions');
    }
    const versions: DesignVersion[] = await versionsResponse.json();
    const nextVersionNumber = versions.length + 1;

    // Serialize canvas state
    console.log('📝 Serializing canvas state...');
    const serializedState = await sandbox.serializeCanvas();

    // Clone page in Adobe Express
    console.log(`🎨 Creating page clone for V${nextVersionNumber}...`);
    const cloneResult = await sandbox.captureVersionSnapshot();

    if (!cloneResult.success) {
      throw new Error('Failed to capture version snapshot');
    }

    // Save to backend
    console.log('💾 Saving to backend...');
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commitMessage: commitMessage || `Version ${nextVersionNumber}`,
        adobeProjectId: cloneResult.snapshotPageId,
        serializedState: serializedState,
        // previewUrl would come from image export
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save version to backend');
    }

    const savedVersion: DesignVersion = await response.json();

    console.log(`✅ Version ${nextVersionNumber} saved successfully!`);

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
 * Restore a previous version to the canvas
 * @param designId - The design ID
 * @param versionNumber - The version number to restore
 * @returns Restore result with version data
 */
export const restoreVersion = async (designId: number, versionNumber: number) => {
  try {
    console.log(`[versionService] 🔄 Step A: Fetching versions for design ${designId}`);
    
    const response = await fetch(`${API_BASE_URL}/designs/${designId}/versions`);
    console.log(`[versionService] ✅ Step B: Got response, status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch version data');
    }

    const versions: DesignVersion[] = await response.json();
    console.log(`[versionService] ✅ Step C: Parsed ${versions.length} versions`);
    
    const targetVersion = versions.find(v => v.versionNumber === versionNumber);
    console.log(`[versionService] 🔍 Step D: Target version found:`, targetVersion ? 'YES' : 'NO');

    if (!targetVersion) {
      throw new Error(`Version ${versionNumber} not found`);
    }

    if (!targetVersion.serializedState) {
      console.error(`[versionService] ❌ Step E: No serializedState!`);
      throw new Error('No serialized state found for this version');
    }

    console.log(`[versionService] ✅ Step F: Has serializedState (${targetVersion.serializedState.length} chars)`);
    console.log(`[versionService] 🔄 Step G: Getting document sandbox proxy...`);
    
    const sandbox = await addOnUISdk.instance.runtime.apiProxy("documentSandbox");
    console.log(`[versionService] ✅ Step H: Got sandbox proxy`);

    console.log(`[versionService] 🔄 Step I: Calling sandbox.restoreFromJson...`);
    const restoreResult = await sandbox.restoreFromJson(targetVersion.serializedState);
    console.log(`[versionService] ✅ Step J: restoreFromJson returned:`, restoreResult);

    if (!restoreResult.success) {
      throw new Error(restoreResult.message || 'Failed to restore canvas');
    }

    return {
      success: true,
      message: `Version ${versionNumber} restored successfully`,
      version: targetVersion,
    };
  } catch (error) {
    console.error('[versionService] ❌ FATAL ERROR:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
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
