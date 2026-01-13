import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { scanForText, createPageVariant } from "./features/localization";

const { runtime } = addOnSandboxSdk.instance;

// Expose the API to the UI thread
runtime.exposeApi({
    ready: () => true,
    scanText: async () => scanForText(),
    createVariant: async (lang, trans) => await createPageVariant(lang, trans)
});