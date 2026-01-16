import { useState } from 'react';
import { addImageToCanvas, generateAssetPipeline } from '../features/assetService';
import { createLocalizedVariants, getTranslations, scanCanvasText } from '../features/localizationService';

const GeneratePage = () => {
  // --- Version Control State ---
  // --- UI State: Asset Gen ---
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Illustration");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  // --- UI State: Localization ---
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["Hindi"]);
  const [isLocalizing, setIsLocalizing] = useState(false);
  const [locStatus, setLocStatus] = useState("");

  const languages = ["Hindi", "Marathi", "Spanish"];

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setStatus("Starting...");

    try {
      const imageUrl = await generateAssetPipeline(
        prompt,
        category,
        (currentStatus) => setStatus(currentStatus)
      );
      setGeneratedImage(imageUrl);
      setStatus("");
    } catch (error) {
      console.error(error);
      setStatus("Generation Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToCanvas = async () => {
    if (!generatedImage) return;
    await addImageToCanvas(generatedImage);
  };

  // --- Handlers: Smart Localization (WIRED UP) ---
  const toggleLang = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(selectedLangs.filter(l => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const handleLocalizeDesign = async () => {
    if (selectedLangs.length === 0) return;

    setIsLocalizing(true);
    setLocStatus("Scanning Canvas...");

    try {
      // 1. Scan Text from current design
      const texts = await scanCanvasText();
      if (!texts || texts.length === 0) {
        setLocStatus("No text found to translate.");
        setIsLocalizing(false);
        return;
      }

      // 2. Translate Text via Python
      setLocStatus(`Translating ${texts.length} text items...`);
      const translationMap = await getTranslations(texts, selectedLangs);

      // 3. Create New Pages
      setLocStatus("Creating new pages...");
      await createLocalizedVariants(translationMap, selectedLangs);

      setLocStatus("✅ Done! Check your Pages panel.");

    } catch (e) {
      console.error(e);
      setLocStatus("Error: " + e);
    } finally {
      setIsLocalizing(false);
    }
  };

  const handlePlaceholderClick = (featureName: string) => {
    console.log(`${featureName} clicked`);
  };

  return (
    <div className="space-y-4 pb-10">

      {/* Asset Generator UI */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Asset Generator</h2>
        <div className="border-t border-gray-200 mb-4"></div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Asset Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option>Illustration</option>
            <option>Icon</option>
            <option>Background Element</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-900 mb-2 block">Describe the asset</label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Minimal flat illustration..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 
                ${isGenerating ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg'}`}
        >
          {isGenerating ? 'Processing...' : 'Generate Vector'}
        </button>

        {generatedImage ? (
          <div className="mt-6">
            <div className="border border-gray-200 rounded-xl p-4 flex flex-col items-center bg-gray-50">
              <img src={generatedImage} alt="Generated" className="h-32 object-contain mb-4" />
              <button
                onClick={handleAddToCanvas}
                className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <span>+</span> Add to Canvas
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-gray-300 rounded-xl h-40 flex flex-col items-center justify-center text-gray-400">
            {isGenerating ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                <div className="text-sm font-medium text-orange-500">{status}</div>
              </div>
            ) : (
              <span>Vector preview will appear here</span>
            )}
          </div>
        )}
      </div>

      {/* Smart Localization (WIRED AND ACTIVE) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Smart Localization</h2>
        <div className="border-t border-gray-200 mb-4"></div>

        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-900 mb-3 block">Select Languages</label>
          <div className="space-y-2">
            {languages.map((lang) => (
              <label key={lang} className="flex items-center gap-3 cursor-pointer">
                {/* Changed to Controlled Input so React tracks selection */}
                <input
                  type="checkbox"
                  checked={selectedLangs.includes(lang)}
                  onChange={() => toggleLang(lang)}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className="text-gray-700">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleLocalizeDesign}
          disabled={isLocalizing || selectedLangs.length === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 
                ${isLocalizing
              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
              : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg'}`}
        >
          {isLocalizing ? 'Scanning & Creating...' : 'Generate Variants'}
        </button>

        {locStatus && (
          <p className="mt-3 text-center text-sm font-medium text-blue-600 animate-pulse">
            {locStatus}
          </p>
        )}
      </div>

      {/* Format Adapter (Placeholder) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Format Adapter</h2>
        <div className="border-t border-gray-200 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handlePlaceholderClick("Story Format")}
            className="border-2 border-gray-300 rounded-xl p-6 text-center group hover:border-orange-500 transition-all"
          >
            <p className="text-gray-900 font-semibold group-hover:text-orange-500">Story Format</p>
            <p className="text-sm text-gray-500 mt-2">9 : 16</p>
          </button>
          <button
            onClick={() => handlePlaceholderClick("Banner Format")}
            className="border-2 border-gray-300 rounded-xl p-6 text-center group hover:border-orange-500 transition-all"
          >
            <p className="text-gray-900 font-semibold group-hover:text-orange-500">Banner Format</p>
            <p className="text-sm text-gray-500 mt-2">16 : 9</p>
          </button>
        </div>
      </div>

    </div>
  );
};

export default GeneratePage;