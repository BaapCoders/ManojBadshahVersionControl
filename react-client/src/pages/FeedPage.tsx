import { useState, useEffect } from 'react';
import {
  loadVersionHistory,
  loadFeedback,
  getVersionPNG,
  restoreVersionToCanvas,
  updateFeedbackStatus,
  saveAsNewVersion,
  deleteVersion,
  type DesignVersion
} from '../features/versionService';
import { GitBranch, Eye, RotateCcw, MessageSquare, CheckCircle, XCircle, X, Save, Trash2 } from 'lucide-react';

interface Feedback {
  id: number;
  versionId: number;
  from: string;
  message: string;
  status: string;
  createdAt: string;
}

const FeedPage = () => {
  const [currentDesignId, setCurrentDesignId] = useState<number | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPNG, setViewingPNG] = useState<string | null>(null);
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [updatingFeedback, setUpdatingFeedback] = useState<number | null>(null);
  const [deletingVersion, setDeletingVersion] = useState<number | null>(null);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    const storedDesignId = localStorage.getItem('currentDesignId');
    if (storedDesignId) {
      const id = parseInt(storedDesignId);
      setCurrentDesignId(id);
      loadData(id);
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async (designId: number) => {
    setLoading(true);
    try {
      const [versionHistory, feedbackData] = await Promise.all([
        loadVersionHistory(designId),
        loadFeedback(designId)
      ]);

      setVersions(versionHistory);
      setFeedback(feedbackData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPNG = async (versionNumber: number) => {
    if (!currentDesignId) return;

    const pngUrl = await getVersionPNG(currentDesignId, versionNumber);
    if (pngUrl) {
      setViewingPNG(pngUrl);
    } else {
      console.warn('No PNG preview available for this version');
    }
  };

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!currentDesignId) return;

    setRestoringVersion(versionNumber);
    try {
      await restoreVersionToCanvas(currentDesignId, versionNumber);
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setRestoringVersion(null);
    }
  };

  const handleSaveVersion = async () => {
    if (!currentDesignId) {
      console.warn('No design selected. Please create a design from Inbox first.');
      return;
    }

    setIsSavingVersion(true);
    try {
      const result = await saveAsNewVersion(currentDesignId, commitMessage || undefined);

      if (result.success) {
        console.log(`Version ${result.version?.versionNumber} saved successfully!`);
        setCommitMessage('');
        setShowVersionDialog(false);

        // Reload version history
        await loadData(currentDesignId);
      } else {
        console.error(`Failed to save version: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving version:', error);
    } finally {
      setIsSavingVersion(false);
    }
  };

  const getNextVersionNumber = () => {
    return versions.length + 1;
  };

  const handleDeleteVersion = async (versionNumber: number) => {
    if (!currentDesignId) return;
    
    console.log('Delete version clicked', versionNumber);
    
    setDeletingVersion(versionNumber);
    try {
      const success = await deleteVersion(currentDesignId, versionNumber);
      
      if (success) {
        console.log(`✅ Version ${versionNumber} deleted successfully!`);
        
        // Reload version history to reflect changes
        await loadData(currentDesignId);
      } else {
        console.error('Failed to delete version');
        alert('Failed to delete version. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting version:', error);
      alert('Error deleting version. Please try again.');
    } finally {
      setDeletingVersion(null);
    }
  };

  const handleUpdateFeedbackStatus = async (
    feedbackId: number,
    newStatus: 'applied' | 'ignored'
  ) => {
    setUpdatingFeedback(feedbackId);
    try {
      const success = await updateFeedbackStatus(feedbackId, newStatus);

      if (success) {
        // Update local state
        setFeedback(feedback.map(f =>
          f.id === feedbackId ? { ...f, status: newStatus } : f
        ));
        console.log(`Feedback marked as ${newStatus}`);
      } else {
        console.error('Failed to update feedback status');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
    } finally {
      setUpdatingFeedback(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'text-green-600 bg-green-50';
      case 'ignored': return 'text-gray-600 bg-gray-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentDesignId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Design Selected</h3>
        <p className="text-gray-600 mb-4">
          Create a design from the Inbox to view version history and feedback
        </p>
      </div>
    );
  }

  const pendingFeedback = feedback.filter(f => f.status === 'pending');
  const processedFeedback = feedback.filter(f => f.status !== 'pending');

  return (
    <div className="space-y-6 pb-6">
      {/* Version History Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <GitBranch size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Version History</h2>
              <p className="text-sm text-gray-600">{versions.length} version{versions.length !== 1 ? 's' : ''} saved</p>
            </div>
          </div>
          <button
            onClick={() => setShowVersionDialog(true)}
            disabled={isSavingVersion}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-95"
          >
            <Save size={18} />
            Save as V{getNextVersionNumber()}
          </button>
        </div>

        {versions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* PNG Preview Thumbnail */}
                  <div className="flex-shrink-0">
                    {version.previewUrl ? (
                      <img
                        src={version.previewUrl}
                        alt={`V${version.versionNumber} Preview`}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                        onError={(e) => {
                          // Fallback if S3 image fails to load
                          (e.target as HTMLImageElement).style.display = 'none';
                          const fallback = document.createElement('div');
                          fallback.className = 'w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center';
                          fallback.innerHTML = '<span class="text-xs text-gray-400">No Preview</span>';
                          (e.target as HTMLImageElement).parentNode?.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No Preview</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        V{version.versionNumber}
                      </span>
                      {index === 0 && (
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded">
                          Latest
                        </span>
                      )}
                      {version.previewUrl && (
                        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded">
                          📸 S3
                        </span>
                      )}
                    </div>

                    {version.commitMessage && (
                      <p className="text-sm text-gray-800 font-medium mb-2">
                        {version.commitMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 {version.createdBy}</span>
                      <span>📅 {formatDate(version.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewPNG(version.versionNumber)}
                      disabled={!version.previewUrl}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${!version.previewUrl
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-md active:scale-95'
                        }`}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button
                      onClick={() => handleRestoreVersion(version.versionNumber)}
                      disabled={!version.previewUrl || restoringVersion === version.versionNumber}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${!version.previewUrl || restoringVersion === version.versionNumber
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
                        }`}
                    >
                      <RotateCcw size={16} className={restoringVersion === version.versionNumber ? 'animate-spin' : ''} />
                      {restoringVersion === version.versionNumber ? 'Loading...' : 'Restore'}
                    </button>
                    <button
                      onClick={() => handleDeleteVersion(version.versionNumber)}
                      disabled={deletingVersion === version.versionNumber || versions.length === 1}
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${deletingVersion === version.versionNumber || versions.length === 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md active:scale-95'
                        }`}
                      title={versions.length === 1 ? 'Cannot delete the last version' : 'Delete this version and its PNG from S3'}
                    >
                      <Trash2 size={16} className={deletingVersion === version.versionNumber ? 'animate-spin' : ''}
                      />
                      {deletingVersion === version.versionNumber ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
            <GitBranch size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-1">No versions saved yet</p>
            <p className="text-sm text-gray-500">Go to Generate tab to save your first version</p>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <MessageSquare size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Client Feedback</h2>
              <p className="text-sm text-gray-600">
                {pendingFeedback.length} pending • {processedFeedback.length} processed
              </p>
            </div>
          </div>
        </div>

        {/* Pending Feedback */}
        {pendingFeedback.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wide">
              🔔 Pending ({pendingFeedback.length})
            </h3>
            <div className="space-y-3">
              {pendingFeedback.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border-2 border-orange-300 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{item.from}</p>
                      <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-4 italic bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                    "{item.message}"
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateFeedbackStatus(item.id, 'applied')}
                      disabled={updatingFeedback === item.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={16} />
                      Mark Applied
                    </button>
                    <button
                      onClick={() => handleUpdateFeedbackStatus(item.id, 'ignored')}
                      disabled={updatingFeedback === item.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={16} />
                      Ignore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processed Feedback */}
        {processedFeedback.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
              ✓ Processed ({processedFeedback.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {processedFeedback.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-bold text-gray-700">{item.from}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getStatusColor(item.status)}`}>
                          {item.status === 'applied' ? '✓ Applied' : '✗ Ignored'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 italic">"{item.message}"</p>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {feedback.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center border-2 border-dashed border-orange-300">
            <MessageSquare size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium">No feedback received yet</p>
            <p className="text-sm text-gray-500 mt-1">Feedback from clients will appear here</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-5 shadow-sm">
        <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <span className="text-xl">💡</span> Activity Tips
        </h4>
        <ul className="text-sm text-purple-800 space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Save Version:</strong> Click "Save as V{getNextVersionNumber()}" to save current canvas state with optional commit message</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Version History:</strong> Click "Restore" to revert canvas to any saved version</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Feedback:</strong> Review client comments and mark them as applied or ignored</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Workflow:</strong> Save versions here or in Generate tab, review and restore as needed</span>
          </li>
        </ul>
      </div>

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

      {/* PNG Viewer Modal */}
      {viewingPNG && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPNG(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setViewingPNG(null)}
              className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors z-10"
            >
              <X size={24} />
            </button>
            <img
              src={viewingPNG}
              alt="Version Preview"
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedPage
