// @ts-ignore
import addOnUISdk from "add-on-ui-sdk";

const PYTHON_SERVER_URL = "http://127.0.0.1:8000";

// --- 1. SCAN ---
export const scanCanvasText = async (): Promise<string[]> => {
    console.log("🔵 UI: Starting Scan Request...");

    if (!addOnUISdk) {
        console.error("❌ UI: SDK import failed! Check manifest or externals.");
        return [];
    }

    try {
        await addOnUISdk.ready;
        const sandbox = await addOnUISdk.instance.runtime.apiProxy("documentSandbox");
        
        console.log("🔵 UI: Calling sandbox.scanText()...");
        const textItems = await sandbox.scanText();
        
        console.log(`🔵 UI: Scan complete. Received ${textItems?.length || 0} items.`);
        return textItems || [];

    } catch (e) {
        console.error("❌ UI: Sandbox Bridge Error:", e);
        return [];
    }
};

// --- 2. TRANSLATE ---
export const getTranslations = async (textItems: string[], languages: string[]) => {
    if (!textItems.length) return {};

    const translationMap: Record<string, Record<string, string>> = {};
    console.log(`🔵 UI: Sending ${textItems.length} items to Python backend...`);

    // Batch process or single loop - here we loop to handle errors individually
    // For production, a bulk API endpoint is recommended
    await Promise.all(textItems.map(async (text) => {
        if (!text.trim()) return;
        
        try {
            const response = await fetch(`${PYTHON_SERVER_URL}/localize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text, languages: languages }),
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const result = await response.json();
            translationMap[text] = result;
        } catch (e) {
            console.error(`❌ Translation Failed for "${text.substring(0, 10)}...":`, e);
        }
    }));

    return translationMap;
};

// --- 3. CREATE ---
export const createLocalizedVariants = async (
    translationMap: Record<string, Record<string, string>>, 
    languages: string[]
) => {
    try {
        const sandbox = await addOnUISdk.instance.runtime.apiProxy("documentSandbox");

        for (const lang of languages) {
            const specificMap: Record<string, string> = {};
            
            // Flatten map for this specific language
            Object.keys(translationMap).forEach(original => {
                if (translationMap[original][lang]) {
                    specificMap[original] = translationMap[original][lang];
                }
            });
            
            console.log(`🔵 UI: Creating Page for ${lang} with ${Object.keys(specificMap).length} translations...`);
            await sandbox.createVariant(lang, specificMap);
        }
    } catch (e) {
        console.error("❌ UI: Page Creation Failed:", e);
    }
};