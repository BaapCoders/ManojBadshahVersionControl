import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { scanForText, createPageVariant } from "./features/localization";
import { captureVersionSnapshot, restoreVersionSnapshot, serializeCanvas, restoreFromJson, exportPreview } from "./features/versionControl";

const { runtime } = addOnSandboxSdk.instance;

// Expose the API to the UI thread
runtime.exposeApi({
    ready: () => true,
    
    // Localization APIs
    scanText: async () => scanForText(),
    createVariant: async (lang, trans) => await createPageVariant(lang, trans),
    
    // Version Control APIs
    captureVersionSnapshot: async () => await captureVersionSnapshot(),
    restoreVersionSnapshot: async (snapshotPageId) => await restoreVersionSnapshot(snapshotPageId),
    serializeCanvas: async () => await serializeCanvas(),
    restoreFromJson: async (jsonString) => await restoreFromJson(jsonString),
    exportPreview: async () => await exportPreview()
});