import { useEffect, useState } from 'react'
// @ts-ignore
import addOnUISdk from "add-on-ui-sdk"; 
import Header from './components/Header'
import Footer from './components/Footer' // We'll render this inside the scrollable area
import InboxPage from './pages/InboxPage'
import GeneratePage from './pages/GeneratePage'
import ReviewPage from './pages/ReviewPage'
import FeedPage from './pages/FeedPage'
import { Inbox, Zap, CheckSquare, Activity } from 'lucide-react'

const App = () => {
  const [activeTab, setActiveTab] = useState('inbox')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    addOnUISdk.ready.then(() => {
        setIsReady(true);
    }).catch((e: any) => console.error(e));
  }, [])

  const renderPage = () => {
    switch (activeTab) {
      case 'inbox': return <InboxPage />
      case 'generate': return <GeneratePage />
      case 'review': return <ReviewPage />
      case 'feed': return <FeedPage />
      default: return <InboxPage />
    }
  }

  // --- Nav Item Helper ---
  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center w-full py-2 ${
        activeTab === id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  )

  if (!isReady) {
    return (
        <div className="flex h-full items-center justify-center bg-white">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
    )
  }

  return (
    // changed from flex-row to flex-col (Mobile Layout)
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans">
      
      {/* 1. Header at Top */}
      <div className="flex-none z-10 bg-white border-b border-gray-200">
        <Header />
      </div>

      {/* 2. Scrollable Content Middle */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
         {renderPage()}
         <div className="mt-6">
            <Footer />
         </div>
      </div>

      {/* 3. Navigation at Bottom (Replaces Sidebar) */}
      <div className="flex-none bg-white border-t border-gray-200 shadow-lg z-10 pb-1">
        <div className="flex justify-around items-center h-14">
            <NavItem id="inbox" icon={Inbox} label="Inbox" />
            <NavItem id="generate" icon={Zap} label="Generate" />
            <NavItem id="review" icon={CheckSquare} label="Review" />
            <NavItem id="feed" icon={Activity} label="Activity" />
        </div>
      </div>

    </div>
  )
}

export default App