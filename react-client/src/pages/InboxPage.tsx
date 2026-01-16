import { useEffect, useState } from 'react'
import BriefCard from '../components/BriefCard'
import { showSuccessDialog, showErrorDialog, showInfoDialog } from '../utils/dialogUtils'

interface Brief {
  id: number
  clientId: number
  messageId: string
  description: string
  status: string
  client: {
    id: number
    phoneNumber: string
    name: string | null
  }
  designs: any[]
  createdAt: string
}

const InboxPage = () => {
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingDesign, setCreatingDesign] = useState<number | null>(null)

  useEffect(() => {
    fetchBriefs()
  }, [])

  const fetchBriefs = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/briefs')
      if (!response.ok) {
        throw new Error('Failed to fetch briefs')
      }
      const data: Brief[] = await response.json()
      setBriefs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching briefs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDesign = async (briefId: number) => {
    setCreatingDesign(briefId)
    try {
      const response = await fetch(`http://localhost:8080/api/briefs/${briefId}/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Design for Brief #${briefId}`,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create design')
      }

      const design = await response.json()
      console.log('Design created:', design)
      
      // Store design ID for use in other pages
      localStorage.setItem('currentDesignId', design.id.toString())
      
      // Refresh briefs to show the new design
      await fetchBriefs()
      
      await showSuccessDialog(`Design created! ID: ${design.id}. Switch to Generate tab to start designing.`)
    } catch (err) {
      console.error('Error creating design:', err)
      await showErrorDialog('Failed to create design. Please try again.')
    } finally {
      setCreatingDesign(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>
  }

  if (briefs.length === 0) {
    return <div className="text-center py-8 text-gray-500">No briefs found</div>
  }

  return (
    <div className="space-y-4">
      {briefs.map((brief) => {
        const hasDesign = brief.designs && brief.designs.length > 0
        const statusColor = 
          brief.status === 'completed' ? 'bg-green-500' :
          brief.status === 'in-progress' ? 'bg-blue-500' : 'bg-orange-500'

        return (
          <div key={brief.id} className="relative">
            <BriefCard
              title={`Brief from ${brief.client.name || brief.client.phoneNumber}`}
              campaign={brief.description.substring(0, 50) + (brief.description.length > 50 ? '...' : '')}
              offer={hasDesign ? `${brief.designs.length} Design(s)` : 'No Designs'}
              code={`#${brief.id}`}
              template={brief.status}
              onOpenTemplate={async () => {
                if (hasDesign) {
                  await showInfoDialog(`Design ID: ${brief.designs[0].id}. Switch to Generate tab.`)
                } else {
                  handleCreateDesign(brief.id)
                }
              }}
            />
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <div className={`${statusColor} text-white text-xs px-2 py-1 rounded-full font-semibold`}>
                {brief.status}
              </div>
            </div>

            {/* Create Design Button */}
            {!hasDesign && (
              <div className="mt-2">
                <button
                  onClick={() => handleCreateDesign(brief.id)}
                  disabled={creatingDesign === brief.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingDesign === brief.id ? 'Creating Design...' : '🎨 Create Design'}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default InboxPage
