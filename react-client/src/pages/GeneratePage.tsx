import { useState, useEffect } from 'react';
import { generateAssetPipeline, addImageToCanvas } from '../features/assetService';
import { scanCanvasText, getTranslations, createLocalizedVariants } from '../features/localizationService';
import { saveAsNewVersion, loadVersionHistory, type DesignVersion } from '../features/versionService';
import { showSuccessDialog, showErrorDialog, showWarningDialog } from '../utils/dialogUtils';
import { Save, GitBranch } from 'lucide-react';

const GeneratePage = () => {
  // --- Version Control State ---
  const [currentDesignId, setCurrentDesignId] = useState<number | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

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

  // --- Load design ID from URL params or localStorage ---
  useEffect(() => {
    // TODO: Get designId from route params when routing is implemented
    // For now, use a hardcoded ID or from localStorage
    const storedDesignId = localStorage.getItem('currentDesignId');
    if (storedDesignId) {
      const id = parseInt(storedDesignId);
      setCurrentDesignId(id);
      loadVersions(id);
    }
  }, []);

  const loadVersions = async (designId: number) => {
    const versionHistory = await loadVersionHistory(designId);
    setVersions(versionHistory);
  };

  // --- Version Control Handlers ---
  const handleSaveVersion = async () => {
    if (!currentDesignId) {
      await showWarningDialog('No design selected. Please create a design from Inbox first.');
      return;
    }

    setIsSavingVersion(true);
    try {
      const result = await saveAsNewVersion(currentDesignId, commitMessage || undefined);
      
      if (result.success) {
        await showSuccessDialog(`Version ${result.version?.versionNumber} saved successfully!`);
        setCommitMessage('');
        setShowVersionDialog(false);
        
        // Reload version history
        await loadVersions(currentDesignId);
      } else {
        await showErrorDialog(`Failed to save version: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving version:', error);
      await showErrorDialog('Failed to save version. Please try again.');
    } finally {
      setIsSavingVersion(false);
    }
  };

  const getNextVersionNumber = () => {
    return versions.length + 1;
  };

  // --- Handlers: Asset Generator ---
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

      {/* Version Control Header */}
      {currentDesignId && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <GitBranch size={24} />
              <div>
                <h3 className="font-bold text-lg">Design #{currentDesignId}</h3>
                <p className="text-blue-100 text-sm">
                  {versions.length > 0 
                    ? `Current: V${versions[versions.length - 1].versionNumber} • ${versions.length} version(s)` 
                    : 'No versions saved yet'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowVersionDialog(true)}
              disabled={isSavingVersion}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              Save as V{getNextVersionNumber()}
            </button>
          </div>
        </div>
      )}

      {/* Version Save Dialog */}
      {showVersionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowVersionDialog(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Save as Version {getNextVersionNumber()}</h3>
            
            <div className="mb-4">
              <label className="text-sm font-semibold text-gray-900 mb-2 block">
                Commit Message (Optional)
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="What changes did you make?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVersionDialog(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVersion}
                disabled={isSavingVersion}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingVersion ? 'Saving...' : 'Save Version'}
              </button>
            </div>
          </div>
        </div>
      )}

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