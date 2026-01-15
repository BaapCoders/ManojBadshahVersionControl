import { useState, useEffect } from 'react';
import {
  loadVersionHistory,
  loadFeedback,
  restoreVersion,
  updateFeedbackStatus,
  type DesignVersion
} from '../features/versionService';
import { GitBranch, RotateCcw, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

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
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);
  const [updatingFeedback, setUpdatingFeedback] = useState<number | null>(null);

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

  const handleRestoreVersion = async (versionNumber: number) => {
    if (!currentDesignId) {
      console.error('❌ No currentDesignId found');
      alert('Error: No design selected');
      return;
    }

    console.log(`🔄 Step 1: Starting restore for V${versionNumber}, Design ${currentDesignId}`);

    // Skip confirmation and directly proceed
    console.log('✅ Step 2: Proceeding with restoration...');
    setRestoringVersion(versionNumber);

    try {
      console.log('🔄 Step 3: Calling restoreVersion...');
      const result:any = await Promise.race([
        restoreVersion(currentDesignId, versionNumber),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 30s')), 30000))
      ]);

      console.log('✅ Step 4: Got result:', result);

      if (result.success) {
        alert(`✅ Successfully restored to Version ${versionNumber}!`);
        await loadData(currentDesignId);
      } else {
        alert(`❌ Failed to restore: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('🏁 Cleanup');
      setRestoringVersion(null);
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
        alert(`Feedback marked as ${newStatus}`);
      } else {
        alert('Failed to update feedback status');
      }
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Failed to update feedback. Please try again.');
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
        </div>

        {versions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
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
                    </div>

                    {version.commitMessage && (
                      <p className="text-sm text-gray-800 font-medium mb-2">
                        {version.commitMessage}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>👤 {version.createdBy}</span>
                      <span>📅 {formatDate(version.createdAt)}</span>
                      {version.serializedState && (
                        <span className="text-green-600 font-semibold">✓ Restorable</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestoreVersion(version.versionNumber)}
                    disabled={restoringVersion === version.versionNumber || !version.serializedState}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${!version.serializedState
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
                      }`}
                  >
                    <RotateCcw size={16} className={restoringVersion === version.versionNumber ? 'animate-spin' : ''} />
                    {restoringVersion === version.versionNumber ? 'Restoring...' : 'Restore'}
                  </button>
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
            <span><strong>Version History:</strong> Click "Restore" to revert canvas to any saved version</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Feedback:</strong> Review client comments and mark them as applied or ignored</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 mt-0.5">•</span>
            <span><strong>Workflow:</strong> Save versions in Generate tab, review them here</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default FeedPage
