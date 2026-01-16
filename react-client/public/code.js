import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { scanForText, createPageVariant } from "./features/localization";
import { serializeCanvas, restoreFromJson } from "./features/versionControl";

const { runtime } = addOnSandboxSdk.instance;

// Expose the API to the UI thread
// SIMPLIFIED: Removed captureVersionSnapshot and restoreVersionSnapshot (page cloning)
// Now focuses on serialization for server-side PNG generation
runtime.exposeApi({
    ready: () => true,
    
    // Localization APIs
    scanText: async () => scanForText(),
    createVariant: async (lang, trans) => await createPageVariant(lang, trans),
    
    // Version Control APIs - SIMPLIFIED
    serializeCanvas: async () => await serializeCanvas(),
    restoreFromJson: async (jsonString) => await restoreFromJson(jsonString)
});