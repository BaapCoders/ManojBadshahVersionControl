import BriefCard from '../components/BriefCard'

interface Brief {
  id: number
  title: string
  campaign: string
  offer: string
  code: string
  template: string
}

const InboxPage = () => {
  const briefs: Brief[] = [
    {
      id: 1,
      title: 'New Brief From Manager (+1 555...)',
      campaign: 'Diwali Sale',
      offer: '50% OFF',
      code: 'DIW4L150',
      template: 'Diwali Brand Master',
    },
    {
      id: 2,
      title: 'New Brief From Manager (+1 555...)',
      campaign: 'Diwali Sale',
      offer: '50% OFF',
      code: 'DIW4L150',
      template: 'Diwali Brand Master',
    },
    {
      id: 3,
      title: 'New Brief From Manager (+1 555...)',
      campaign: 'Diwali Sale',
      offer: '50% OFF',
      code: 'DIW4L150',
      template: 'Diwali Brand Master',
    },
  ]

  return (
    <div className="space-y-4">
      {briefs.map((brief) => (
        <BriefCard
          key={brief.id}
          title={brief.title}
          campaign={brief.campaign}
          offer={brief.offer}
          code={brief.code}
          template={brief.template}
          onOpenTemplate={() => console.log('Opening template:', brief.template)}
        />
      ))}
    </div>
  )
}

export default InboxPage
