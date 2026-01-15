import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { scanForText, createPageVariant } from "./features/localization";
import { saveVersion, serializeCanvas, restoreFromJson, exportPreview } from "./features/versionControl";

const { runtime } = addOnSandboxSdk.instance;

// Expose the API to the UI thread
runtime.exposeApi({
    ready: () => true,
    
    // Localization APIs
    scanText: async () => scanForText(),
    createVariant: async (lang, trans) => await createPageVariant(lang, trans),
    
    // Version Control APIs
    saveVersion: async (versionNumber) => await saveVersion(versionNumber),
    serializeCanvas: async () => await serializeCanvas(),
    restoreFromJson: async (jsonString) => await restoreFromJson(jsonString),
    exportPreview: async () => await exportPreview()
});