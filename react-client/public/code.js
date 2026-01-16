import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor } from "express-document-sdk";
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
    restoreFromJson: async (jsonString) => await restoreFromJson(jsonString),
    
    // Import image with automatic page resize
    importImageWithPageResize: async (imageBlob) => {
        try {
            console.log("🎨 Loading image and resizing page...");
            
            // Load the bitmap to get its dimensions
            const bitmapImage = await editor.loadBitmapImage(imageBlob);
            console.log(`📐 Image dimensions: ${bitmapImage.width}x${bitmapImage.height}`);
            
            // Get the current page
            const currentPage = editor.context.currentPage;
            console.log(`📄 Current page dimensions: ${currentPage.width}x${currentPage.height}`);
            
            // Queue the edit to resize page and add image
            editor.queueAsyncEdit(() => {
                // Resize the page to match the image dimensions
                currentPage.width = bitmapImage.width;
                currentPage.height = bitmapImage.height;
                console.log(`✨ Page resized to: ${bitmapImage.width}x${bitmapImage.height}`);
                
                // Create and add the image container to fill the entire page
                const imageContainer = editor.createImageContainer(bitmapImage, {
                    initialSize: { width: bitmapImage.width, height: bitmapImage.height }
                });
                
                // Add to the current artboard at position (0, 0)
                imageContainer.translation = { x: 0, y: 0 };
                editor.context.insertionParent.children.append(imageContainer);
                
                console.log("✅ Image successfully added to canvas with matching page size");
            });
            
            return { success: true };
        } catch (error) {
            console.error("❌ Failed to import image:", error);
            return { success: false, error: error.message };
        }
    }
});